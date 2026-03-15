/**
 * Apify API client helper for Traceable.
 * Runs actors synchronously and returns dataset items.
 *
 * Docs: https://docs.apify.com/api/v2#/reference/actors/run-actor-synchronously
 */

const APIFY_TOKEN = process.env.APIFY_API_TOKEN ?? '';
const APIFY_BASE = 'https://api.apify.com/v2';

/**
 * Runs an Apify actor synchronously and returns the dataset items.
 * @param actorId  - e.g. "apify/wappalyzer-actor"
 * @param input    - Actor input object
 * @param timeout  - Max seconds to wait (default 60)
 */
export async function runActor<T = unknown>(
  actorId: string,
  input: Record<string, unknown>,
  timeout = 60
): Promise<T[]> {
  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${timeout}&memory=512`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify actor ${actorId} failed [${res.status}]: ${text}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? (data as T[]) : [];
}
