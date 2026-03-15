/**
 * POST /api/v1/sessions/start
 *
 * Creates a new visitor session. The server always extracts the IP from
 * trusted proxy headers — the client must never supply it.
 *
 * Request body:
 *   { visitor_id?, landing_url, referrer?, user_agent? }
 *
 * Response:
 *   201 { session_id, created_at }
 *   400 { error: string }
 *   500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractClientIP } from '@/lib/ip';
import { getPageCategory } from '@/lib/pageCategory';
import { resolveLocationFromIP } from '@/lib/location';
import { lookupIP } from '@/lib/ipinfo';
import { runPipeline } from '@/lib/pipeline';
import type { StartSessionRequest, StartSessionResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- Parse body ---
  let body: StartSessionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { visitor_id, landing_url, referrer, user_agent } = body;

  if (!landing_url || typeof landing_url !== 'string') {
    return NextResponse.json({ error: '`landing_url` is required' }, { status: 400 });
  }

  // --- Extract IP server-side — never trust client ---
  // Priority: proxy headers (CF/nginx/XFF public IP) → Next.js socket IP
  //           → raw XFF as last resort (captures ::1 in local dev)
  const ip =
    extractClientIP(request) ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null;

  // --- Determine page category from landing URL ---
  const page_category = getPageCategory(landing_url);

  // --- Build session record ---
  const now = new Date().toISOString();
  const sessionData = {
    visitor_id: visitor_id ?? null,
    ip,
    user_agent: user_agent ?? request.headers.get('user-agent') ?? null,
    referrer: referrer ?? request.headers.get('referer') ?? null,
    landing_url,
    pages: [
      {
        page_url: landing_url,
        page_category,
        entered_at: now,
      },
    ],
    created_at: now,
    updated_at: now,
  };

  // --- Persist to Supabase ---
  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert(sessionData)
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[sessions/start] Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const response: StartSessionResponse = {
      session_id: data.id,
      created_at: data.created_at,
    };

    // Fire-and-forget: resolve location (Positionstack) + company (IPInfo) in parallel
    if (ip) {
      Promise.allSettled([
        resolveLocationFromIP(ip),
        lookupIP(ip),
      ]).then(async ([locationResult, ipinfoResult]) => {
        const location = locationResult.status === 'fulfilled' ? locationResult.value : null;
        const ipinfo  = ipinfoResult.status  === 'fulfilled' ? ipinfoResult.value  : null;

        // Upsert company record from IPInfo org data
        let companyId: string | null = null;
        let companyDomain: string | null = null;
        if (ipinfo?.company_name) {
          const now = new Date().toISOString();

          // Try to find existing company by name first
          const { data: existing } = await supabaseAdmin
            .from('companies')
            .select('id, domain')
            .eq('name', ipinfo.company_name)
            .single();

          if (existing?.id) {
            // Update last_seen_at on repeat visit
            await supabaseAdmin
              .from('companies')
              .update({ last_seen_at: now, org: ipinfo.org, ipinfo_raw: ipinfo })
              .eq('id', existing.id);
            companyId = existing.id;
            companyDomain = existing.domain;
          } else {
            // Insert new company
            const { data: inserted } = await supabaseAdmin
              .from('companies')
              .insert({
                name:        ipinfo.company_name,
                org:         ipinfo.org,
                city:        ipinfo.city,
                region:      ipinfo.region,
                country:     ipinfo.country,
                ipinfo_raw:  ipinfo,
                last_seen_at: now,
                created_at:  now,
                updated_at:  now,
              })
              .select('id, domain')
              .single();
            companyId = inserted?.id ?? null;
            companyDomain = inserted?.domain ?? null;
          }
        }

        // Update session with location + company_id in one call
        const update: Record<string, unknown> = {};
        if (location)   update.location   = location;
        if (companyId)  update.company_id = companyId;

        if (Object.keys(update).length > 0) {
          const { error } = await supabaseAdmin
            .from('sessions')
            .update(update)
            .eq('id', data.id);
          if (error) console.warn('[sessions/start] Failed to update session:', error);
        }

        // Create identity record from IP resolution
        if (ipinfo) {
          await supabaseAdmin
            .from('identities')
            .upsert(
              {
                session_id:     data.id,
                source:         'ipinfo',
                full_name:      null,
                company_name:   ipinfo.company_name,
                company_domain: companyDomain,
                location:       [ipinfo.city, ipinfo.region, ipinfo.country].filter(Boolean).join(', ') || null,
                country:        ipinfo.country,
                created_at:     new Date().toISOString(),
                updated_at:     new Date().toISOString(),
              },
              { onConflict: 'session_id,source' }
            )
            .then(({ error: idError }) => {
              if (idError) console.warn('[sessions/start] Identity upsert error:', idError);
            });
        }

        // Trigger pipeline (score + enrichment + alerts) now that company is identified
        runPipeline(data.id).catch(() => {});
      }).catch(() => { /* silent fail */ });
    }

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('[sessions/start] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
