/**
 * POST /api/v1/internal/emails/test
 *
 * Sends a test email via SMTP and records it in emails_sent table.
 * Used from the dashboard to verify email configuration.
 *
 * Body (optional): { to?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/smtp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const recipient = body.to ?? process.env.SALES_TEAM_EMAIL ?? "";

    if (!recipient) {
      return NextResponse.json(
        { error: "No recipient configured. Set SALES_TEAM_EMAIL in env." },
        { status: 400 }
      );
    }

    const now = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const result = await sendEmail({
      to: recipient,
      subject: `Traceable Test Email — ${now}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="background:#093555;padding:20px 24px;border-radius:8px 8px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><span style="font-size:18px;font-weight:700;color:#fff;">Traceable</span></td>
            <td style="text-align:right;"><span style="font-size:12px;color:#9ca3af;">Test Email</span></td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background:#f0fdf4;line-height:48px;font-size:24px;">&#10003;</div>
          </div>
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;text-align:center;">SMTP Configuration Working</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;line-height:1.6;">
            Your email delivery is set up correctly. Daily digests and alert emails will be delivered to this inbox.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;">
            <tr><td style="padding:6px 16px;font-size:13px;">
              <span style="color:#6b7280;font-weight:600;">Sent at</span>
              <span style="float:right;color:#111827;">${now}</span>
            </td></tr>
            <tr><td style="padding:6px 16px;font-size:13px;border-top:1px solid #e5e7eb;">
              <span style="color:#6b7280;font-weight:600;">Recipient</span>
              <span style="float:right;color:#111827;">${recipient}</span>
            </td></tr>
            <tr><td style="padding:6px 16px;font-size:13px;border-top:1px solid #e5e7eb;">
              <span style="color:#6b7280;font-weight:600;">SMTP Host</span>
              <span style="float:right;color:#111827;">${process.env.SMTP_HOST ?? "not set"}</span>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background:#f9fafb;padding:16px 24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none;">
          <span style="font-size:11px;color:#9ca3af;">Sent by Traceable — Visitor Intelligence & Sales Alerting</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    // Track in emails_sent
    if (result.success) {
      const db = getSupabaseAdmin();
      await db.from("emails_sent").insert({
        type: "test",
        subject: `Traceable Test Email — ${now}`,
        recipient,
        status: "sent",
        metadata: { message_id: result.messageId, triggered_by: "dashboard" },
      });
    }

    return NextResponse.json({
      ok: result.success,
      error: result.error ?? null,
      message_id: result.messageId ?? null,
    });
  } catch (err) {
    console.error("[emails/test] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
