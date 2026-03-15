/**
 * POST /api/v1/sessions/events
 *
 * Records a session event and bumps the parent session's updated_at.
 *
 * For `page_leave` events: also patches sessions.pages JSONB to write
 * duration_seconds into the matching page entry so the scoring pipeline
 * has accurate time-on-page data.
 *
 * Request body:
 *   { session_id, event_type, page_url, metadata? }
 *
 * Response:
 *   200 { ok: true }
 *   400 { error: string }
 *   404 { error: string }
 *   500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPageCategory } from '@/lib/pageCategory';
import { runPipeline } from '@/lib/pipeline';
import type { SessionEventRequest, SessionEventResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: SessionEventRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { session_id, event_type, page_url, metadata } = body;

  if (!session_id || typeof session_id !== 'string') {
    return NextResponse.json({ error: '`session_id` is required' }, { status: 400 });
  }
  if (!event_type || typeof event_type !== 'string') {
    return NextResponse.json({ error: '`event_type` is required' }, { status: 400 });
  }
  if (!page_url || typeof page_url !== 'string') {
    return NextResponse.json({ error: '`page_url` is required' }, { status: 400 });
  }

  try {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id, pages')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const page_category = getPageCategory(page_url);
    const now = new Date().toISOString();

    // Extract duration for page_leave events
    const durationSeconds =
      event_type === 'page_leave' && typeof metadata?.duration_seconds === 'number'
        ? metadata.duration_seconds
        : null;

    // Insert event record
    const { error: insertError } = await supabaseAdmin.from('session_events').insert({
      session_id,
      event_type,
      page_url,
      page_category,
      metadata: metadata ?? null,
      duration_seconds: durationSeconds,
      timestamp: now,
    });

    if (insertError) {
      console.error('[sessions/events] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
    }

    // For page_leave: patch duration_seconds into sessions.pages
    if (event_type === 'page_leave' && typeof metadata?.duration_seconds === 'number') {
      const pages: Array<Record<string, unknown>> = Array.isArray(session.pages) ? session.pages : [];

      // Find the last entry matching this URL and set its duration
      let patched = false;
      const updatedPages = [...pages].reverse().map((p) => {
        if (!patched && p.page_url === page_url && !p.duration_seconds) {
          patched = true;
          return { ...p, duration_seconds: metadata.duration_seconds };
        }
        return p;
      }).reverse();

      if (patched) {
        await supabaseAdmin
          .from('sessions')
          .update({ pages: updatedPages, updated_at: now })
          .eq('id', session_id);

        // Fire-and-forget: run scoring + alerting pipeline
        runPipeline(session_id).catch(() => {});

        return NextResponse.json({ ok: true } satisfies SessionEventResponse);
      }
    }

    // Bump session updated_at for all other events
    await supabaseAdmin
      .from('sessions')
      .update({ updated_at: now })
      .eq('id', session_id);

    // Fire-and-forget: run scoring + alerting pipeline on page_leave
    if (event_type === 'page_leave') {
      runPipeline(session_id).catch(() => {});
    }

    return NextResponse.json({ ok: true } satisfies SessionEventResponse);
  } catch (err) {
    console.error('[sessions/events] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
