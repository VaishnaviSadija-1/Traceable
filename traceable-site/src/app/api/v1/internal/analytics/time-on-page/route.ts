/**
 * GET /api/v1/internal/analytics/time-on-page
 *
 * Returns per-page visit counts and site-wide average visit duration
 * from Umami Analytics.
 *
 * Query params:
 *   days  – lookback window in days (default: 30, max: 90)
 *
 * Response:
 *   {
 *     pages: [{ url, visits }],
 *     site: { pageviews, visitors, visits, bounces, totaltime, avgVisitDurationSeconds }
 *     window_days: number
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPageVisits, getSiteStats } from '@/lib/umami';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rawDays = req.nextUrl.searchParams.get('days');
  const days = Math.min(Math.max(parseInt(rawDays ?? '30', 10) || 30, 1), 90);

  const endAt = new Date();
  const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);

  try {
    const [pages, site] = await Promise.all([
      getPageVisits(startAt, endAt),
      getSiteStats(startAt, endAt),
    ]);

    // Sort by most visited
    pages.sort((a, b) => b.visits - a.visits);

    return NextResponse.json({ pages, site, window_days: days });
  } catch (err) {
    console.error('[analytics/time-on-page]', err);
    return NextResponse.json({ error: 'umami_fetch_failed' }, { status: 502 });
  }
}
