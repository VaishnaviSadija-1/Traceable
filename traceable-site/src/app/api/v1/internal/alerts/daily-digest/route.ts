/**
 * POST /api/v1/internal/alerts/daily-digest
 *
 * Aggregates all scored sessions from the past 24 hours,
 * computes persona + recommended actions, and sends a
 * consolidated daily digest email to the sales team via SMTP.
 *
 * Intended to be called by a cron job at 8 PM daily.
 *
 * Body (optional): { hours?: number }   default: 24
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/smtp';
import type {
  IntentStage,
  PersonaInference,
  SalesAction,
  DigestEntry,
  EnrichedCompany,
  EnrichedContact,
  PageCategory,
  Session,
} from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}


// ---------------------------------------------------------------------------
// Load scored sessions from last N hours
// ---------------------------------------------------------------------------

async function loadScoredSessions(hours: number): Promise<DigestEntry[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data: scores, error } = await supabaseAdmin
    .from('scores')
    .select('*')
    .gte('computed_at', cutoff)
    .order('lead_score', { ascending: false });

  if (error || !scores || scores.length === 0) return [];

  const entries: DigestEntry[] = [];

  for (const score of scores) {
    // Load session
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', score.session_id)
      .single();

    if (!session) continue;

    const sessionTyped = session as Session;

    // Load company — try company_id first, then domain lookups
    let company: EnrichedCompany | null = null;
    const companyId = score.company_id ?? sessionTyped.company_id ?? null;
    const companyDomain = score.company_domain ?? sessionTyped.identity?.domain ?? null;

    if (companyId) {
      const { data: companyRow } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      if (companyRow) company = companyRow as EnrichedCompany;
    }

    if (!company && companyDomain) {
      const { data: companyRow } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('domain', companyDomain)
        .single();
      if (companyRow) company = companyRow as EnrichedCompany;
    }

    // Get lead contact
    const contacts: EnrichedContact[] = company?.contacts ?? [];
    const leadContact = contacts.find((c) =>
      /ceo|cto|vp|head|director/i.test(c.title ?? '')
    ) ?? contacts[0] ?? null;

    // Build page summary from session pages
    const pageCounts = new Map<PageCategory, number>();
    for (const p of sessionTyped.pages ?? []) {
      pageCounts.set(p.page_category, (pageCounts.get(p.page_category) ?? 0) + 1);
    }
    // Also count from session_events page_view
    const { data: pageEvents } = await supabaseAdmin
      .from('session_events')
      .select('page_category')
      .eq('session_id', score.session_id)
      .eq('event_type', 'page_view');

    for (const e of pageEvents ?? []) {
      const cat = e.page_category as PageCategory;
      pageCounts.set(cat, (pageCounts.get(cat) ?? 0) + 1);
    }

    const PAGE_LABELS: Record<string, string> = {
      pricing: 'Pricing',
      'sales-agent': 'Product / Sales Agent',
      'case-studies': 'Case Studies',
      other: 'General Pages',
    };
    const pagesSummary = Array.from(pageCounts.entries())
      .map(([cat, count]) => {
        const label = PAGE_LABELS[cat] ?? cat;
        return count > 1 ? `${label} (${count} visits)` : label;
      })
      .join(', ') || 'No pages recorded';

    const persona: PersonaInference = {
      likely_persona: score.persona ?? 'Unknown',
      confidence: score.persona_confidence ?? 0,
      signals: score.persona_signals ?? [],
    };

    const recommendedActions: SalesAction[] = score.recommended_actions ?? [];
    const scoreOutOf10 = score.score_out_of_10 ?? (score.score / 10);

    // Resolve company name: enriched company → identity name → domain → fallback
    const resolvedCompanyName =
      company?.name ??
      sessionTyped.identity?.name ??
      sessionTyped.identity?.rb2b_person?.company ??
      companyDomain ??
      undefined;

    entries.push({
      session_id: score.session_id,
      company_name: resolvedCompanyName,
      company_domain: companyDomain ?? undefined,
      industry: company?.industry,
      employee_count: company?.employee_count,
      contact_name: leadContact?.name,
      contact_title: leadContact?.title,
      contact_linkedin: leadContact?.linkedin_url,
      intent_score_display: `${scoreOutOf10} / 10`,
      intent_stage: (score.intent_stage as IntentStage) ?? 'Research',
      persona,
      recommended_actions: recommendedActions,
      pages_summary: pagesSummary,
      total_time_seconds: score.session_duration_secs ?? 0,
      is_repeat: score.repeat_visit ?? false,
      ai_summary: (company as Record<string, unknown> | null)?.ai_summary as string | null | undefined,
      multi_person: score.multi_person ?? false,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// HTML Email Builder
// ---------------------------------------------------------------------------

function buildDigestEmail(entries: DigestEntry[], date: string): string {
  // Filter out entries without a company name — nothing useful to show sales
  const namedEntries = entries.filter((e) => e.company_name);

  const entryRows = namedEntries.map((entry) => {
    const companyName = entry.company_name!;
    const metaParts = [entry.industry, entry.employee_count ? `${entry.employee_count.toLocaleString()} employees` : ''].filter(Boolean).join(' · ');

    // Build the "why act now" reasoning
    const whyParts: string[] = [];
    if (entry.intent_stage === 'Decision') whyParts.push('This visitor is in the decision stage and likely evaluating solutions now.');
    else if (entry.intent_stage === 'Evaluation') whyParts.push('This visitor is actively evaluating options and comparing vendors.');
    else if (entry.intent_stage === 'Awareness') whyParts.push('This visitor is in early research and becoming aware of solutions in this space.');
    if (entry.is_repeat) whyParts.push('This is a repeat visit, indicating sustained interest.');
    if (entry.multi_person) whyParts.push('Multiple people from this company have visited, suggesting a buying committee is forming.');
    if (entry.total_time_seconds > 180) whyParts.push(`Spent ${formatDuration(entry.total_time_seconds)} on the site, showing deep engagement.`);

    const whyText = whyParts.length > 0 ? whyParts.join(' ') : 'Visitor showed meaningful intent signals during their session.';

    // Recommended actions — plain text
    const actionsList = entry.recommended_actions
      .slice(0, 3)
      .map((a) => `- ${a.action}`)
      .join('<br/>');

    return `
      <tr><td style="padding:0 0 28px 0;">
        <!-- Company Name Header -->
        <div style="font-size:17px;font-weight:700;color:#111827;margin-bottom:2px;">${companyName}</div>
        ${metaParts ? `<div style="font-size:13px;color:#6b7280;margin-bottom:10px;">${metaParts}</div>` : '<div style="height:8px;"></div>'}

        <!-- Score & Stage -->
        <div style="font-size:14px;color:#374151;margin-bottom:8px;">
          <strong>Intent Score:</strong> ${entry.intent_score_display} &nbsp;&middot;&nbsp; <strong>Stage:</strong> ${entry.intent_stage}${entry.is_repeat ? ' &nbsp;&middot;&nbsp; Repeat visitor' : ''}${entry.multi_person ? ' &nbsp;&middot;&nbsp; Multiple visitors' : ''}
        </div>

        ${entry.contact_name ? `<div style="font-size:14px;color:#374151;margin-bottom:8px;"><strong>Contact:</strong> ${entry.contact_name}${entry.contact_title ? `, ${entry.contact_title}` : ''}${entry.contact_linkedin ? ` — <a href="${entry.contact_linkedin}" style="color:#2563eb;text-decoration:none;">LinkedIn</a>` : ''}</div>` : ''}

        <!-- AI Analysis -->
        ${entry.ai_summary ? `<div style="font-size:14px;color:#1e3a5f;line-height:1.6;margin-bottom:8px;">${entry.ai_summary}</div>` : ''}

        <!-- Why Act Now -->
        <div style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:8px;">
          <strong>Why act now:</strong> ${whyText}
        </div>

        <!-- Next Actions -->
        ${actionsList ? `<div style="font-size:14px;color:#374151;line-height:1.7;"><strong>Recommended next steps:</strong><br/>${actionsList}</div>` : ''}

        <!-- Separator -->
        <div style="border-bottom:1px solid #e5e7eb;margin-top:20px;"></div>
      </td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traceable — Daily Digest</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:20px 24px;border-radius:8px 8px 0 0;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;">Traceable</span>
              <span style="font-size:13px;color:#9ca3af;margin-left:8px;">Daily Sales Digest &middot; ${date}</span>
            </td>
          </tr>

          <!-- Summary line -->
          <tr>
            <td style="background:#ffffff;padding:20px 24px;border-bottom:1px solid #e5e7eb;">
              <div style="font-size:14px;color:#374151;">
                <strong>${namedEntries.length}</strong> companies detected today${namedEntries.filter((e) => e.intent_stage === 'Decision' || e.intent_stage === 'Evaluation').length > 0 ? ` — <strong style="color:#dc2626;">${namedEntries.filter((e) => e.intent_stage === 'Decision' || e.intent_stage === 'Evaluation').length} hot leads</strong> requiring attention` : ''}.
              </div>
            </td>
          </tr>

          <!-- Entries -->
          <tr>
            <td style="background:#ffffff;padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${entryRows || `
                <tr>
                  <td style="text-align:center;padding:32px 0;color:#6b7280;font-size:14px;">
                    No high-intent visitors in the last 24 hours.
                  </td>
                </tr>`}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:14px 24px;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;">
              <span style="color:#9ca3af;font-size:11px;">Traceable · Automated daily digest · Scores are inferred from visitor behavior</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const hours = Math.min(Math.max(parseInt(body.hours ?? '24', 10) || 24, 1), 168);

    const entries = await loadScoredSessions(hours);

    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = buildDigestEmail(entries, date);

    const subject = entries.length > 0
      ? `Traceable Daily Digest — ${entries.length} visitor${entries.length > 1 ? 's' : ''} detected (${date})`
      : `Traceable Daily Digest — No high-intent visitors (${date})`;

    const emailResult = await sendEmail({ subject, html });

    // Record digest in alerts table
    if (entries.length > 0) {
      await supabaseAdmin.from('alerts').insert({
        session_id: entries[0].session_id, // primary session
        score: 0,
        status: emailResult.success ? 'sent' : 'failed',
        slack_sent: false,
        email_sent: emailResult.success,
        metadata: {
          type: 'daily_digest',
          entries_count: entries.length,
          hours_window: hours,
          email_error: emailResult.error ?? null,
        },
      });
    }

    // Track in emails_sent table
    if (emailResult.success) {
      await supabaseAdmin.from('emails_sent').insert({
        type: 'daily_digest',
        subject,
        recipient: process.env.SALES_TEAM_EMAIL ?? 'unknown',
        session_id: entries.length > 0 ? entries[0].session_id : null,
        status: 'sent',
        metadata: {
          entries_count: entries.length,
          hours_window: hours,
          message_id: emailResult.messageId ?? null,
        },
      });
    }

    return NextResponse.json({
      entries_count: entries.length,
      email_sent: emailResult.success,
      email_error: emailResult.error ?? null,
      subject,
    });
  } catch (err) {
    console.error('[daily-digest] Unhandled error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
