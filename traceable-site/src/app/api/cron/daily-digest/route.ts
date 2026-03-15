/**
 * GET /api/cron/daily-digest
 *
 * Vercel Cron handler — runs daily at 8 PM IST (2:30 PM UTC).
 * Calls the daily-digest endpoint and tracks the email.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  // Verify cron secret in production
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Call the daily digest endpoint
    const res = await fetch(
      `${BASE_URL}/api/v1/internal/alerts/daily-digest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: 24 }),
      }
    );

    const result = await res.json();

    // Track in emails_sent table
    if (result.email_sent) {
      const db = getSupabaseAdmin();
      await db.from("emails_sent").insert({
        type: "daily_digest",
        subject: result.subject ?? "Traceable Daily Digest",
        recipient: process.env.SALES_TEAM_EMAIL ?? "unknown",
        status: "sent",
        metadata: {
          entries_count: result.entries_count,
          triggered_by: "cron",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("[cron/daily-digest] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
