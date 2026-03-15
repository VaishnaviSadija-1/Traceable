/**
 * Umami Analytics API client
 *
 * Fetches per-page visit counts and site-level time-on-page stats
 * from Umami Cloud (https://api.umami.is/v1).
 *
 * Required env vars:
 *   UMAMI_API_KEY              – Umami API key (server-only)
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID – website ID (also used by the tracking script)
 */

const UMAMI_API_KEY = process.env.UMAMI_API_KEY ?? '';
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '';
const BASE_URL = 'https://api.umami.is/v1';

export interface PageVisitMetric {
  url: string;
  visits: number;
}

export interface SiteStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  /** Total time spent across all visits, in seconds */
  totaltime: number;
  /** Average visit duration in seconds */
  avgVisitDurationSeconds: number;
}

/**
 * Returns visit counts per URL for the given time window.
 * Maps to GET /websites/{id}/metrics?type=url
 */
export async function getPageVisits(
  startAt: Date,
  endAt: Date
): Promise<PageVisitMetric[]> {
  const params = new URLSearchParams({
    startAt: startAt.getTime().toString(),
    endAt: endAt.getTime().toString(),
    type: 'url',
  });

  const res = await fetch(
    `${BASE_URL}/websites/${UMAMI_WEBSITE_ID}/metrics?${params}`,
    {
      headers: { 'x-umami-api-key': UMAMI_API_KEY },
      next: { revalidate: 300 }, // cache for 5 minutes
    }
  );

  if (!res.ok) {
    throw new Error(`Umami metrics error: ${res.status}`);
  }

  const json = await res.json();
  // Umami returns { data: [{x, y}] } or [{x, y}] depending on version
  const rows: { x: string; y: number }[] = json.data ?? json ?? [];

  return rows.map((row) => ({ url: row.x, visits: row.y }));
}

/**
 * Returns site-wide stats (pageviews, visitors, avg visit duration) for
 * the given time window.
 * Maps to GET /websites/{id}/stats
 */
export async function getSiteStats(startAt: Date, endAt: Date): Promise<SiteStats> {
  const params = new URLSearchParams({
    startAt: startAt.getTime().toString(),
    endAt: endAt.getTime().toString(),
  });

  const res = await fetch(
    `${BASE_URL}/websites/${UMAMI_WEBSITE_ID}/stats?${params}`,
    {
      headers: { 'x-umami-api-key': UMAMI_API_KEY },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    throw new Error(`Umami stats error: ${res.status}`);
  }

  const data = await res.json();

  const visits: number = data.visits?.value ?? 0;
  const totaltime: number = data.totaltime?.value ?? 0; // seconds

  return {
    pageviews: data.pageviews?.value ?? 0,
    visitors: data.visitors?.value ?? 0,
    visits,
    bounces: data.bounces?.value ?? 0,
    totaltime,
    avgVisitDurationSeconds: visits > 0 ? Math.round(totaltime / visits) : 0,
  };
}
