/**
 * POST /api/v1/internal/analytics/sync
 *
 * Fetches the latest data from Umami Analytics and upserts rows into
 * session_events (session_id = NULL, event_type = 'umami_page_view').
 *
 * Body (optional): { days?: number }   default: 30, max: 90
 *
 * Response: { synced_at, window_days, pages_synced, site_stats }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPageVisits, getSiteStats } from '@/lib/umami';
import { getPageCategory } from '@/lib/pageCategory';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let days = 30;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.days) days = Math.min(Math.max(parseInt(body.days, 10) || 30, 1), 90);
  } catch {
    // use default
  }

  const endAt = new Date();
  const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);
  const synced_at = endAt.toISOString();

  try {
    const [pageVisits, siteStats] = await Promise.all([
      getPageVisits(startAt, endAt),
      getSiteStats(startAt, endAt),
    ]);

    // Delete existing Umami rows for this window before reinserting
    await supabaseAdmin
      .from('session_events')
      .delete()
      .eq('event_type', 'umami_page_view')
      .eq('metadata->>window_days', String(days));

    let pages_synced = 0;

    if (pageVisits.length > 0) {
      const rows = pageVisits.map(({ url, visits }) => ({
        session_id: null,
        event_type: 'umami_page_view',
        page_url: url,
        page_category: getPageCategory(url),
        metadata: {
          visits,
          window_days: days,
          avg_visit_duration_seconds: siteStats.avgVisitDurationSeconds,
          synced_at,
        },
        timestamp: synced_at,
      }));

      const { error } = await supabaseAdmin.from('session_events').insert(rows);

      if (error) {
        console.error('[analytics/sync] insert failed:', error);
        return NextResponse.json({ error: 'insert_failed', detail: error.message }, { status: 500 });
      }

      pages_synced = rows.length;
    }

    return NextResponse.json({ synced_at, window_days: days, pages_synced, site_stats: siteStats });
  } catch (err) {
    console.error('[analytics/sync] unhandled error:', err);
    return NextResponse.json({ error: 'sync_failed' }, { status: 502 });
  }
}
