import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "traceable_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is required");
  return secret;
}

export function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    sub: username,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  });
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + signature;
}

export function verifySessionToken(
  token: string
): { sub: string; exp: number } | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    if (signature !== expected) return null;

    const data = JSON.parse(payload);
    if (Date.now() > data.exp) return null;

    return data;
  } catch {
    return null;
  }
}

export function verifyCredentials(
  username: string,
  password: string
): boolean {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD env vars are required");
  }
  return username === adminUser && password === adminPass;
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const data = verifySessionToken(token);
  return data?.sub ?? null;
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
