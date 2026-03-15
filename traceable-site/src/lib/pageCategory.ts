/**
 * Maps a full URL or a URL path to a Traceable page category.
 *
 * Categories:
 *   'pricing'      — /pricing (and sub-paths)
 *   'sales-agent'  — /sales-agent (and sub-paths)
 *   'case-studies' — /case-studies (and sub-paths)
 *   'other'        — everything else (home, blog, docs, etc.)
 */

import type { PageCategory } from '@/types';

/**
 * Returns the `PageCategory` for a given URL string.
 *
 * Accepts both full URLs (`https://example.com/pricing?plan=pro`) and bare
 * paths (`/pricing`).
 */
export function getPageCategory(url: string): PageCategory {
  let pathname: string;

  try {
    // If it's a full URL, use URL parser to get only the pathname
    const parsed = new URL(url);
    pathname = parsed.pathname;
  } catch {
    // Bare path or relative URL — use it directly
    pathname = url.split('?')[0].split('#')[0];
  }

  // Normalise: lowercase, ensure leading slash, strip trailing slash
  const normalized = ('/' + pathname.toLowerCase()).replace(/\/+/g, '/').replace(/\/$/, '') || '/';

  if (normalized === '/pricing' || normalized.startsWith('/pricing/')) {
    return 'pricing';
  }

  if (normalized === '/sales-agent' || normalized.startsWith('/sales-agent/')) {
    return 'sales-agent';
  }

  if (normalized === '/case-studies' || normalized.startsWith('/case-studies/')) {
    return 'case-studies';
  }

  return 'other';
}
