/**
 * POST /api/v1/internal/companies/summary
 *
 * Generates an AI account intelligence summary for a company,
 * saves it to Supabase, and sends it via SMTP to the sales team.
 *
 * Body: { company_id: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  generateAccountSummary,
  AccountIntelligenceContext,
} from "@/lib/account-intelligence";
import { sendEmail } from "@/lib/smtp";

export async function POST(req: NextRequest) {
  try {
    const { company_id } = await req.json();

    if (!company_id) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();

    // Fetch company data
    const { data: company, error: companyError } = await db
      .from("companies")
      .select("*")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Fetch sessions + scores for browsing behavior context
    const [sessionsResult, scoresResult] = await Promise.all([
      db
        .from("sessions")
        .select("id, landing_url, pages, created_at")
        .eq("company_id", company_id)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("scores")
        .select("score, buyer_stage, high_intent_pages, pages_visited, repeat_visit, session_duration_secs")
        .eq("company_id", company_id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const sessions = sessionsResult.data ?? [];
    const scores = scoresResult.data ?? [];

    // Build page categories from all sessions
    const allPageCategories: string[] = [];
    for (const session of sessions) {
      const pages = (session.pages ?? []) as Array<{ page_category?: string }>;
      for (const p of pages) {
        if (p.page_category) allPageCategories.push(p.page_category);
      }
    }

    // Aggregate scoring data
    const latestScore = scores[0]?.score ?? null;
    const buyerStage = scores[0]?.buyer_stage ?? null;
    const repeatVisitor = scores.some((s: { repeat_visit?: boolean }) => s.repeat_visit);
    const highIntentPages = scores.reduce(
      (sum: number, s: { high_intent_pages?: number }) => sum + (s.high_intent_pages ?? 0),
      0
    );
    const totalTimeSeconds = scores.reduce(
      (sum: number, s: { session_duration_secs?: number | null }) =>
        sum + (s.session_duration_secs ?? 0),
      0
    );

    const techStack = (company.tech_stack ?? []) as string[];

    const ctx: AccountIntelligenceContext = {
      companyName: company.name ?? company.domain ?? "Unknown",
      domain: company.domain ?? "",
      industry: company.industry,
      employeeCount: company.employee_count,
      revenueRange: company.revenue_range,
      hqCity: company.hq_city,
      hqCountry: company.hq_country,
      techStack,
      totalSessions: sessions.length,
      pagesVisited: [...new Set(allPageCategories)],
      highIntentPages,
      latestScore,
      buyerStage,
      repeatVisitor,
      totalTimeSeconds: totalTimeSeconds || null,
    };

    // Generate AI summary
    const summary = await generateAccountSummary(ctx);

    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary. Check OPENAI_API_KEY." },
        { status: 502 }
      );
    }

    // Save to Supabase
    const { error: updateError } = await db
      .from("companies")
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq("id", company_id);

    if (updateError) {
      console.error("[summary] Supabase update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save summary" },
        { status: 500 }
      );
    }

    // Send via SMTP
    const companyName = company.name ?? company.domain ?? "Unknown Company";
    const subject = `Account Intelligence: ${companyName}`;
    const emailResult = await sendEmail({
      subject,
      html: buildEmailHtml(companyName, company.domain, summary, ctx),
    });

    // Track in emails_sent table
    if (emailResult.success) {
      await db.from("emails_sent").insert({
        type: "account_intelligence",
        subject,
        recipient: process.env.SALES_TEAM_EMAIL ?? "unknown",
        company_id,
        status: "sent",
        metadata: {
          message_id: emailResult.messageId ?? null,
          triggered_by: "dashboard",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      summary,
      email_sent: emailResult.success,
      email_error: emailResult.error ?? null,
    });
  } catch (error) {
    console.error("[summary] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildEmailHtml(
  companyName: string,
  domain: string | null,
  summary: string,
  ctx: AccountIntelligenceContext
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #093555; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 600;">Account Intelligence Summary</h1>
        <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.85;">${companyName}${domain ? ` (${domain})` : ""}</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e8e4e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 15px; line-height: 1.7; color: #1a1a1a; margin: 0 0 20px;">
          ${summary.replace(/\n/g, "<br>")}
        </p>

        <hr style="border: none; border-top: 1px solid #e8e4e0; margin: 20px 0;">

        <table style="width: 100%; font-size: 13px; color: #6b7280;">
          <tr>
            <td style="padding: 4px 0;"><strong>Industry:</strong></td>
            <td>${ctx.industry ?? "—"}</td>
            <td style="padding: 4px 0;"><strong>Employees:</strong></td>
            <td>${ctx.employeeCount?.toLocaleString() ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Sessions:</strong></td>
            <td>${ctx.totalSessions}</td>
            <td style="padding: 4px 0;"><strong>Intent Score:</strong></td>
            <td>${ctx.latestScore != null ? `${ctx.latestScore}/100` : "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Buyer Stage:</strong></td>
            <td>${ctx.buyerStage ?? "—"}</td>
            <td style="padding: 4px 0;"><strong>High-Intent Pages:</strong></td>
            <td>${ctx.highIntentPages}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 16px;">
        Generated by Traceable AI &middot; ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>
    </div>
  `;
}
