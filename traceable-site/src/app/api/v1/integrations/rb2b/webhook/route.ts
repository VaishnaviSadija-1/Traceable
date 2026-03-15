/**
 * POST /api/v1/integrations/rb2b/webhook
 *
 * Receives person-match webhooks from RB2B.
 * When a website visitor is deanonymised by RB2B, this endpoint:
 *   1. Validates the webhook signature.
 *   2. Finds the active session matching the IP or visitor_id.
 *   3. Upserts the person into the `identities` table and links it to the session.
 *   4. Fires-and-forgets an enrichment request to the internal enrich endpoint.
 *
 * Response:
 *   200 { ok: true }
 *   400 { error: string }
 *   401 { error: string }
 *   500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { RB2BPayload } from '@/types';
import { createHmac } from 'crypto';

/** Verify HMAC-SHA256 signature sent by RB2B in the X-RB2B-Signature header. */
function verifyRB2BSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RB2B_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret is configured, skip verification in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[rb2b/webhook] RB2B_WEBHOOK_SECRET not set — skipping signature check');
      return true;
    }
    return false;
  }

  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    // Constant-time comparison to prevent timing attacks
    return signature.length === expected.length && signature === expected;
  } catch {
    return false;
  }
}

/** Trigger enrichment asynchronously — do not await. */
function triggerEnrichment(sessionId: string, domain?: string): void {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = `${baseUrl}/api/v1/internal/enrich`;

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, domain }),
  }).catch((err) => {
    console.warn('[rb2b/webhook] Enrichment trigger failed (non-fatal):', err);
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- Read raw body for signature verification ---
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  // --- Validate signature ---
  const signature = request.headers.get('x-rb2b-signature') ?? '';
  if (!verifyRB2BSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  // --- Parse payload ---
  let payload: RB2BPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { person, visitor_id, ip } = payload;

  if (!person) {
    // Gracefully handle pings or unknown events
    return NextResponse.json({ ok: true });
  }

  try {
    // --- Find matching active session ---
    // Try to match by visitor_id first (most reliable), then by IP.
    let sessionId: string | null = null;

    if (visitor_id) {
      const { data } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('visitor_id', visitor_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) sessionId = data.id;
    }

    if (!sessionId && ip) {
      const { data } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('ip', ip)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) sessionId = data.id;
    }

    if (!sessionId) {
      // No matching session — still record the identity for later linkage
      console.warn('[rb2b/webhook] No matching session found for visitor_id/ip:', { visitor_id, ip });
    }

    // --- Upsert identity record ---
    const identityData = {
      session_id: sessionId,
      source: 'rb2b',
      email: person.email ?? null,
      full_name: person.full_name ?? (`${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() || null),
      first_name: person.first_name ?? null,
      last_name: person.last_name ?? null,
      linkedin_url: person.linkedin_url ?? null,
      title: person.title ?? null,
      company_name: person.company ?? null,
      company_domain: person.company_domain ?? null,
      company_linkedin_url: person.company_linkedin_url ?? null,
      location: person.location ?? null,
      country: person.country ?? null,
      rb2b_raw: person,
      created_at: new Date().toISOString(),
    };

    const { data: identity, error: identityError } = await supabaseAdmin
      .from('identities')
      .upsert(identityData, {
        onConflict: 'session_id,source',
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (identityError) {
      console.error('[rb2b/webhook] Identity upsert error:', identityError);
      return NextResponse.json({ error: 'Failed to store identity' }, { status: 500 });
    }

    // --- Link identity to session if we have one ---
    if (sessionId && identity) {
      await supabaseAdmin
        .from('sessions')
        .update({ identity_id: identity.id, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    // --- Fire-and-forget enrichment ---
    if (sessionId) {
      triggerEnrichment(sessionId, person.company_domain);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[rb2b/webhook] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
