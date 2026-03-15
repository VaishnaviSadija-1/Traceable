/**
 * GrowthMarketing.ai Company Enrichment
 *
 * Endpoint: GET https://api.technologychecker.io/v1/company?domain={domain}
 * Auth: Authorization: Bearer YOUR_API_KEY
 * Free tier: 100 lookups/month (no credit card)
 * Docs: https://growthmarketing.ai/free-company-enrichment-api/
 */

export interface GMCompanyData {
  id?: string;
  name?: string;
  website?: string;
  industry?: string;
  size?: string;           // e.g. "11-50", "51-200"
  founded?: number;
  locality?: string;       // city
  region?: string;         // state / province
  country?: string;
  linkedin_url?: string;
  description?: string;    // scraped from website meta (not in GM API)
}

/**
 * Fetches company firmographics from GrowthMarketing.ai by domain.
 * Returns null if the key is not set or the lookup fails.
 */
export async function enrichCompany(domain: string): Promise<GMCompanyData | null> {
  const apiKey = process.env.GROWTHMARKETING_API_KEY;
  if (!apiKey) {
    console.warn('[growthmarketing] GROWTHMARKETING_API_KEY not set');
    return null;
  }

  try {
    const url = `https://api.technologychecker.io/v1/company?domain=${encodeURIComponent(domain)}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      console.warn(`[growthmarketing] HTTP ${res.status} for domain ${domain}`);
      return null;
    }

    const data = await res.json();

    // API returns an array — take the first result
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return null;

    return {
      id:           result.id,
      name:         result.name,
      website:      result.website,
      industry:     result.industry,
      size:         result.size,
      founded:      result.founded ? Number(result.founded) : undefined,
      locality:     result.locality,
      region:       result.region,
      country:      result.country,
      linkedin_url: result.linkedin_url
        ? result.linkedin_url.startsWith('http')
          ? result.linkedin_url
          : `https://${result.linkedin_url}`
        : undefined,
    };
  } catch (err) {
    console.warn('[growthmarketing] Fetch error:', err);
    return null;
  }
}

/**
 * Scrapes the company website homepage for a description
 * via OpenGraph / meta description tags.
 * Used as a supplement since GM API doesn't return descriptions.
 */
export async function scrapeDescription(domain: string): Promise<string | null> {
  try {
    const res = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Traceable/1.0)' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Try og:description first, then meta description
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1];

    if (ogDesc) return ogDesc.trim();

    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1];

    return metaDesc?.trim() ?? null;
  } catch {
    return null;
  }
}
