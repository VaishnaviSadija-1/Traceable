/**
 * POST /api/v1/internal/identity/resolve
 *
 * Internal-only route: resolves a company identity for a session via IPInfo.
 *
 * Flow:
 *   1. Receive { session_id, ip }.
 *   2. Call IPInfo to get org / company metadata for the IP.
 *   3. Determine if the IP belongs to a business (not ISP/hosting/residential).
 *   4. Upsert company record in `companies` table.
 *   5. Link session → company and set confidence level.
 *   6. Return the merged CompanyIdentity.
 *
 * This route is called server-to-server only. Protect it with the internal
 * secret header `X-Internal-Token` in production.
 *
 * Response:
 *   200 { identity: CompanyIdentity | null, company_id?: string }
 *   400 { error: string }
 *   500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type {
  IdentityResolveRequest,
  IdentityResolveResponse,
  IPInfoResponse,
  CompanyIdentity,
  IdentityConfidence,
} from '@/types';

/**
 * Non-business org prefixes from IPInfo. These indicate ISPs, hosting
 * providers, VPNs, or residential connections — not useful for B2B intent.
 */
const NON_BUSINESS_ORG_KEYWORDS = [
  'comcast',
  'verizon',
  'at&t',
  'att ',
  'charter',
  'spectrum',
  'cox ',
  'centurylink',
  'lumen',
  'amazon',
  'aws',
  'google',
  'microsoft azure',
  'cloudflare',
  'digitalocean',
  'linode',
  'vultr',
  'hetzner',
  'ovh',
  'fastly',
  'akamai',
  'residential',
  'mobile',
  'broadband',
  'cable',
  'dsl',
  'fiber',
];

/**
 * Returns true if the IPInfo response looks like a real business network,
 * not an ISP, cloud provider, or residential connection.
 */
function isBusinessIP(info: IPInfoResponse): boolean {
  // IPInfo provides an explicit company.type for paid plans
  if (info.company?.type) {
    return info.company.type === 'business' || info.company.type === 'education' || info.company.type === 'government';
  }

  // Fallback: inspect the org string for known non-business keywords
  const org = (info.org ?? '').toLowerCase();
  if (!org) return false;

  const isNonBusiness = NON_BUSINESS_ORG_KEYWORDS.some((kw) => org.includes(kw));
  return !isNonBusiness;
}

/**
 * Derive a confidence level based on data richness from IPInfo.
 */
function deriveConfidence(info: IPInfoResponse): IdentityConfidence {
  if (info.company?.domain && info.company?.name) return 'high';
  if (info.company?.name || info.org) return 'medium';
  return 'low';
}

/** Validate internal requests in production via a shared secret header. */
function isAuthorized(request: NextRequest): boolean {
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) {
    // Not enforced in development
    return process.env.NODE_ENV !== 'production';
  }
  return request.headers.get('x-internal-token') === token;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Parse body ---
  let body: IdentityResolveRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { session_id, ip } = body;

  if (!session_id || typeof session_id !== 'string') {
    return NextResponse.json({ error: '`session_id` is required' }, { status: 400 });
  }
  if (!ip || typeof ip !== 'string') {
    return NextResponse.json({ error: '`ip` is required' }, { status: 400 });
  }

  const ipinfoToken = process.env.IPINFO_TOKEN;
  if (!ipinfoToken) {
    return NextResponse.json({ error: 'IPINFO_TOKEN is not configured' }, { status: 500 });
  }

  try {
    // --- Call IPInfo API ---
    const ipinfoUrl = `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${ipinfoToken}`;
    const ipinfoRes = await fetch(ipinfoUrl, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // cache for 1 hour at edge
    });

    if (!ipinfoRes.ok) {
      console.error('[identity/resolve] IPInfo error:', ipinfoRes.status, await ipinfoRes.text());
      return NextResponse.json({ error: 'IPInfo lookup failed' }, { status: 502 });
    }

    const ipinfo: IPInfoResponse = await ipinfoRes.json();

    // --- Check for bogon/private IPs ---
    if (ipinfo.bogon) {
      const response: IdentityResolveResponse = { identity: null };
      return NextResponse.json(response);
    }

    // --- Determine if this is a business network ---
    if (!isBusinessIP(ipinfo)) {
      const response: IdentityResolveResponse = { identity: null };
      return NextResponse.json(response);
    }

    // --- Build company identity ---
    const confidence = deriveConfidence(ipinfo);
    const companyName = ipinfo.company?.name ?? ipinfo.org?.replace(/^AS\d+\s+/, '') ?? null;
    const companyDomain = ipinfo.company?.domain ?? null;

    const identity: CompanyIdentity = {
      domain: companyDomain ?? undefined,
      name: companyName ?? undefined,
      source: 'ipinfo',
      confidence,
      ipinfo_data: ipinfo,
    };

    // --- Upsert company record ---
    const now = new Date().toISOString();
    const companyUpsertData = {
      domain: companyDomain,
      name: companyName,
      country: ipinfo.country ?? null,
      city: ipinfo.city ?? null,
      region: ipinfo.region ?? null,
      org: ipinfo.org ?? null,
      ipinfo_raw: ipinfo,
      confidence,
      last_seen_at: now,
      updated_at: now,
    };

    let companyId: string | undefined;

    if (companyDomain) {
      // Upsert by domain if we have it
      const { data: company, error: upsertError } = await supabaseAdmin
        .from('companies')
        .upsert(
          { ...companyUpsertData, created_at: now },
          { onConflict: 'domain', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (upsertError) {
        console.error('[identity/resolve] Company upsert error:', upsertError);
      } else {
        companyId = company?.id;
      }
    } else if (companyName) {
      // Fallback: upsert by name if no domain
      const { data: company, error: upsertError } = await supabaseAdmin
        .from('companies')
        .upsert(
          { ...companyUpsertData, created_at: now },
          { onConflict: 'name', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (upsertError) {
        console.error('[identity/resolve] Company upsert (by name) error:', upsertError);
      } else {
        companyId = company?.id;
      }
    }

    // --- Link session → company ---
    if (companyId) {
      const { error: linkError } = await supabaseAdmin
        .from('sessions')
        .update({ company_id: companyId, updated_at: now })
        .eq('id', session_id);

      if (linkError) {
        console.warn('[identity/resolve] Failed to link session to company:', linkError);
      }
    }

    const response: IdentityResolveResponse = { identity, company_id: companyId };
    return NextResponse.json(response);
  } catch (err) {
    console.error('[identity/resolve] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
