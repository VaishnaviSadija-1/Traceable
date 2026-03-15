/**
 * POST /api/v1/internal/test/ip-lookup
 *
 * Admin tool to test IP → company resolution.
 * Does NOT create sessions, scores, or trigger alerts.
 *
 * Body: { ip: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { lookupIP } from "@/lib/ipinfo";

export async function POST(req: NextRequest) {
  try {
    const { ip } = await req.json();

    if (!ip || typeof ip !== "string") {
      return NextResponse.json(
        { error: "ip is required" },
        { status: 400 }
      );
    }

    const result = await lookupIP(ip);

    if (!result) {
      return NextResponse.json({
        ok: true,
        resolved: false,
        message: "No company data found for this IP. It may be a residential, VPN, or hosting IP.",
      });
    }

    return NextResponse.json({
      ok: true,
      resolved: true,
      company_name: result.company_name ?? null,
      org: result.org ?? null,
      city: result.city ?? null,
      region: result.region ?? null,
      country: result.country ?? null,
      hostname: result.hostname ?? null,
    });
  } catch (err) {
    console.error("[test/ip-lookup] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
