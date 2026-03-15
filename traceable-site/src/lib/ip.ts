/**
 * Server-side IP extraction utility for Traceable.
 *
 * Always extracts IP from trusted server-controlled headers — never from
 * client-supplied body or query parameters.
 *
 * Priority order:
 *   1. CF-Connecting-IP  (Cloudflare edge)
 *   2. X-Real-IP         (nginx / other reverse proxies)
 *   3. X-Forwarded-For   (first non-private IP in the list)
 *   4. null              (fallback — caller decides how to handle)
 */

/**
 * CIDR private / reserved IP ranges (IPv4).
 * We skip these when scanning X-Forwarded-For to find the real public IP.
 */
const PRIVATE_RANGES: [number, number][] = [
  // 10.0.0.0/8
  [ipToInt('10.0.0.0'), ipToInt('10.255.255.255')],
  // 172.16.0.0/12
  [ipToInt('172.16.0.0'), ipToInt('172.31.255.255')],
  // 192.168.0.0/16
  [ipToInt('192.168.0.0'), ipToInt('192.168.255.255')],
  // 127.0.0.0/8  (loopback)
  [ipToInt('127.0.0.0'), ipToInt('127.255.255.255')],
  // 169.254.0.0/16  (link-local)
  [ipToInt('169.254.0.0'), ipToInt('169.254.255.255')],
  // 100.64.0.0/10  (shared address space / Carrier-grade NAT)
  [ipToInt('100.64.0.0'), ipToInt('100.127.255.255')],
];

/** Convert a dotted-decimal IPv4 string to a 32-bit integer for range checks. */
function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** Returns true if `ip` falls in a private / reserved IPv4 range. */
export function isPrivateIP(ip: string): boolean {
  // IPv6 loopback / link-local — treat as private
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }

  // Strip IPv6-mapped IPv4 prefix (::ffff:192.168.x.x)
  const normalized = ip.startsWith('::ffff:') ? ip.slice(7) : ip;

  // Only attempt range check for IPv4
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(normalized)) {
    return false; // pure IPv6 — not classified as private here
  }

  const int = ipToInt(normalized);
  return PRIVATE_RANGES.some(([lo, hi]) => int >= lo && int <= hi);
}

/**
 * Extracts the real client IP from an incoming Next.js / Web API `Request`.
 *
 * @param request - The `Request` object from a Next.js route handler.
 * @returns The first credible public IPv4/IPv6 address, or `null` if none found.
 */
export function extractClientIP(request: Request): string | null {
  // Dev override: spoof a public IP for local testing
  const DEV_IP_OVERRIDE = process.env.DEV_IP_OVERRIDE;
  if (DEV_IP_OVERRIDE) return DEV_IP_OVERRIDE;

  const headers = request.headers;

  // 1. Cloudflare — most authoritative when behind CF
  const cf = headers.get('cf-connecting-ip');
  if (cf) {
    const trimmed = cf.trim();
    if (trimmed && !isPrivateIP(trimmed)) return trimmed;
  }

  // 2. X-Real-IP — set by nginx and many other reverse proxies
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    const trimmed = xRealIp.trim();
    if (trimmed && !isPrivateIP(trimmed)) return trimmed;
  }

  // 3. X-Forwarded-For — comma-separated list, leftmost is client IP
  //    but can be spoofed if the proxy doesn't strip it, so we look for
  //    the first public IP rather than blindly trusting position 0.
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const candidates = xff.split(',').map((s) => s.trim()).filter(Boolean);
    for (const candidate of candidates) {
      if (!isPrivateIP(candidate)) return candidate;
    }
  }

  return null;
}
