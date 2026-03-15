/**
 * IPInfo lookup utility.
 * Fetches org/company name, city, region, country from an IP address.
 * Docs: https://ipinfo.io/developers
 */

export interface IPInfoData {
  ip: string;
  org: string | null;          // e.g. "AS15169 Google LLC"
  company_name: string | null; // org stripped of AS prefix, e.g. "Google LLC"
  city: string | null;
  region: string | null;
  country: string | null;
  postal: string | null;
  timezone: string | null;
  hostname: string | null;
  loc: string | null;          // "lat,lng"
}

/** Strips the ASN prefix from IPInfo org string. "AS15169 Google LLC" → "Google LLC" */
function parseCompanyName(org: string | null): string | null {
  if (!org) return null;
  return org.replace(/^AS\d+\s+/, '').trim() || null;
}

/**
 * Looks up an IP address via IPInfo and returns structured data.
 * Returns null if the token is not set, the IP is private, or the call fails.
 */
export async function lookupIP(ip: string): Promise<IPInfoData | null> {
  const token = process.env.IPINFO_TOKEN;
  if (!token) {
    console.warn('[ipinfo] IPINFO_TOKEN not set');
    return null;
  }

  // Skip private/loopback IPs
  if (
    !ip ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.')
  ) {
    return null;
  }

  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`[ipinfo] HTTP ${res.status} for IP ${ip}`);
      return null;
    }

    const data = await res.json();

    if (data.bogon) return null;

    const org = data.org ?? null;

    return {
      ip: data.ip ?? ip,
      org,
      company_name: parseCompanyName(org),
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      postal: data.postal ?? null,
      timezone: data.timezone ?? null,
      hostname: data.hostname ?? null,
      loc: data.loc ?? null,
    };
  } catch (err) {
    console.warn('[ipinfo] Fetch error:', err);
    return null;
  }
}
