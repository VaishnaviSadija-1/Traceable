/**
 * Location resolution via Positionstack reverse geocoding.
 *
 * Positionstack /reverse accepts an IP address directly and returns
 * structured location data (city, region, country, coordinates, etc.)
 *
 * Docs: https://positionstack.com/documentation
 */

export interface LocationData {
  label: string | null;         // Full formatted address / place label
  name: string | null;          // Place name
  city: string | null;
  region: string | null;        // State / province
  country: string | null;       // Full country name
  country_code: string | null;  // ISO 3166-1 alpha-2 (e.g. "US")
  latitude: number | null;
  longitude: number | null;
  postal_code: string | null;
  confidence: number | null;    // 0–1 quality score
  map_url: string | null;
}

interface PositionstackResult {
  label?: string;
  name?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  number?: string;
  street?: string;
  postal_code?: string;
  confidence?: number;
  region?: string;
  region_code?: string;
  county?: string;
  locality?: string;
  administrative_area?: string;
  neighbourhood?: string;
  country?: string;
  country_code?: string;
  map_url?: string;
  distance?: number;
}

interface PositionstackResponse {
  data?: PositionstackResult[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Resolves an IP address to a structured location using Positionstack.
 *
 * @param ip - IPv4 or IPv6 address
 * @returns LocationData or null if the lookup fails / key not configured
 */
export async function resolveLocationFromIP(ip: string): Promise<LocationData | null> {
  const accessKey = process.env.POSITIONSTACK_API_KEY;

  if (!accessKey) {
    console.warn('[location] POSITIONSTACK_API_KEY is not set — skipping location lookup');
    return null;
  }

  // Skip private / loopback IPs — positionstack can't resolve them
  if (
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return null;
  }

  try {
    const url = new URL('https://api.positionstack.com/v1/reverse');
    url.searchParams.set('access_key', accessKey);
    url.searchParams.set('query', ip);
    url.searchParams.set('limit', '1');
    url.searchParams.set('output', 'json');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[location] Positionstack HTTP ${res.status}`);
      return null;
    }

    const body: PositionstackResponse = await res.json();

    if (body.error) {
      console.warn('[location] Positionstack error:', body.error.message);
      return null;
    }

    const results = body.data;
    if (!results || results.length === 0) return null;

    const r = results[0];

    return {
      label: r.label ?? null,
      name: r.name ?? r.locality ?? null,
      city: r.locality ?? r.county ?? r.name ?? null,
      region: r.region ?? r.administrative_area ?? null,
      country: r.country ?? null,
      country_code: r.country_code ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      postal_code: r.postal_code ?? null,
      confidence: r.confidence ?? null,
      map_url: r.map_url ?? null,
    };
  } catch (err) {
    console.warn('[location] Positionstack fetch error:', err);
    return null;
  }
}
