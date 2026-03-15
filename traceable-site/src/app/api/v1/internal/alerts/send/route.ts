/**
 * POST /api/v1/internal/alerts/send
 *
 * Assembles a rich alert payload, sends it to Slack (Block Kit),
 * falls back to SendGrid email on Slack failure, and records the
 * alert in the `alerts` Supabase table.
 *
 * Body: { session_id: string, urgency: string, is_repeat: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateDraftOpener } from '@/lib/draftOpener';
import type { Session, EnrichedCompany, EnrichedContact, PageVisit, PageCategory } from '@/types';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? '';
const ALERT_EMAIL = process.env.ALERT_EMAIL ?? '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ?? '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Counts visits per page category from a pages array. */
function countPageVisits(pages: PageVisit[]): Map<PageCategory, number> {
  const counts = new Map<PageCategory, number>();
  for (const page of pages) {
    counts.set(page.page_category, (counts.get(page.page_category) ?? 0) + 1);
  }
  return counts;
}

const PAGE_LABELS: Record<string, string> = {
  pricing: 'Pricing',
  'sales-agent': 'Product / Sales Agent',
  'case-studies': 'Case Studies',
  other: 'General Pages',
};

/** Formats page visit counts as a readable string */
function formatPageList(counts: Map<PageCategory, number>): string {
  const parts: string[] = [];
  for (const [cat, count] of counts.entries()) {
    const label = PAGE_LABELS[cat] ?? cat;
    parts.push(count > 1 ? `${label} (${count} visits)` : label);
  }
  return parts.join(', ') || 'No pages recorded';
}

/** Formats seconds as "X min Y sec" or "X min". */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs}s`;
}

/** Picks the best leadership contact from a contacts array. */
function pickLeadContact(contacts: EnrichedContact[]): EnrichedContact | null {
  const priority = ['ceo', 'cto', 'vp sales', 'vp of sales', 'head of sales'];
  for (const title of priority) {
    const match = contacts.find(
      (c) => (c.title ?? '').toLowerCase().includes(title)
    );
    if (match) return match;
  }
  return contacts[0] ?? null;
}

// ---------------------------------------------------------------------------
// Slack Block Kit builder
// ---------------------------------------------------------------------------

function buildSlackBlocks(params: {
  companyName?: string;
  industry?: string;
  employeeCount?: number;
  hqCity?: string;
  hqCountry?: string;
  contact: EnrichedContact | null;
  pageCounts: Map<PageCategory, number>;
  totalDurationSeconds: number;
  intentScore: number;
  fitScore: number;
  leadScore: number;
  techStack: string[];
  draftOpener: string;
  sessionId: string;
  contactLinkedinUrl?: string;
  urgency: string;
  isRepeat: boolean;
}): unknown[] {
  const {
    companyName,
    industry,
    employeeCount,
    hqCity,
    hqCountry,
    contact,
    pageCounts,
    totalDurationSeconds,
    intentScore,
    fitScore,
    leadScore,
    techStack,
    draftOpener,
    sessionId,
    contactLinkedinUrl,
    urgency,
    isRepeat,
  } = params;

  const urgencyEmoji = urgency === 'high' ? '🔴' : '🟡';
  const repeatTag = isRepeat ? ' _(repeat visit)_' : '';

  // Header line: company name or fallback
  const headerText = companyName
    ? `${urgencyEmoji} [${urgency === 'high' ? 'High Intent' : 'Medium Intent'}] *${companyName}* is on your site${repeatTag}`
    : `${urgencyEmoji} [${urgency === 'high' ? 'High Intent' : 'Medium Intent'}] Unknown company is on your site${repeatTag}`;

  // Meta line: industry | employees | location
  const metaParts: string[] = [];
  if (industry) metaParts.push(industry);
  if (employeeCount) metaParts.push(`${employeeCount.toLocaleString()} employees`);
  const location = [hqCity, hqCountry].filter(Boolean).join(', ');
  if (location) metaParts.push(location);

  // Contact line
  const contactLine = contact
    ? `*Contact:* ${[contact.name, contact.title].filter(Boolean).join(', ')}`
    : null;

  // Pages line
  const pagesLine = `*Pages:* ${formatPageList(pageCounts)} — ${formatDuration(totalDurationSeconds)} total`;

  // Scores line
  const scoresLine = `*Intent:* ${intentScore} | *Fit:* ${fitScore} | *Lead Score:* ${leadScore}`;

  // Tech stack line
  const techLine =
    techStack.length > 0 ? `*Tech Stack:* ${techStack.slice(0, 6).join(', ')}` : null;

  // Build blocks array
  const blocks: unknown[] = [
    // Header
    {
      type: 'header',
      text: { type: 'plain_text', text: headerText.replace(/\*/g, ''), emoji: true },
    },
    // Section with all meta info
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          headerText,
          metaParts.length > 0 ? metaParts.join(' | ') : null,
          contactLine,
          pagesLine,
          scoresLine,
          techLine,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    },
    // Divider
    { type: 'divider' },
    // Draft opener
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `💬 *Draft opener:* "${draftOpener}"`,
      },
    },
    // Divider
    { type: 'divider' },
  ];

  // Action buttons
  const actions: unknown[] = [
    {
      type: 'button',
      text: { type: 'plain_text', text: 'View Session', emoji: true },
      value: sessionId,
      action_id: 'view_session',
    },
  ];

  // Add LinkedIn button only if URL is present
  if (contactLinkedinUrl) {
    actions.push({
      type: 'button',
      text: { type: 'plain_text', text: 'View on LinkedIn', emoji: true },
      url: contactLinkedinUrl,
      action_id: 'view_linkedin',
    });
  }

  actions.push({
    type: 'button',
    text: { type: 'plain_text', text: 'Mark Acted On', emoji: true },
    value: sessionId,
    action_id: 'mark_acted_on',
    style: 'primary',
  });

  blocks.push({
    type: 'actions',
    elements: actions,
  });

  return blocks;
}

// ---------------------------------------------------------------------------
// SendGrid email fallback
// ---------------------------------------------------------------------------

async function sendEmailFallback(params: {
  subject: string;
  htmlBody: string;
}): Promise<boolean> {
  if (!SENDGRID_API_KEY || !ALERT_EMAIL) {
    console.warn('[send] SendGrid not configured — skipping email fallback');
    return false;
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: ALERT_EMAIL }] }],
        from: { email: ALERT_EMAIL, name: 'Traceable Alerts' },
        subject: params.subject,
        content: [{ type: 'text/html', value: params.htmlBody }],
      }),
    });

    if (!res.ok) {
      console.error('[send] SendGrid HTTP error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[send] SendGrid fetch error:', err);
    return false;
  }
}

/** Builds a polished HTML email version of the alert. */
function buildEmailHtml(params: {
  companyName?: string;
  metaLine: string;
  contactLine: string;
  pagesLine: string;
  scoresLine: string;
  techLine: string;
  draftOpener: string;
  urgency: string;
  isRepeat: boolean;
  aiSummary?: string | null;
}): string {
  const title = params.companyName
    ? `${params.companyName} is on your site`
    : `New high-intent visitor detected`;

  const urgencyColor = params.urgency === 'high' ? '#dc2626' : '#ea580c';
  const urgencyLabel = params.urgency === 'high' ? 'High Intent' : 'Medium Intent';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#093555;padding:20px 24px;border-radius:8px 8px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><span style="font-size:18px;font-weight:700;color:#fff;">Traceable</span></td>
            <td style="text-align:right;">
              <span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:600;color:#fff;background:${urgencyColor};">${urgencyLabel}</span>
              ${params.isRepeat ? '<span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:12px;font-weight:600;color:#fff;background:#7c3aed;margin-left:6px;">Repeat</span>' : ''}
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;">
          <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111827;">${title}</h1>
          ${params.metaLine ? `<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">${params.metaLine}</p>` : '<div style="height:16px;"></div>'}

          ${params.contactLine ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;padding:12px 16px;background:#f9fafb;border-radius:6px;">
            <tr><td>
              <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Contact</div>
              <div style="font-size:14px;color:#111827;">${params.contactLine}</div>
            </td></tr>
          </table>` : ''}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td style="padding:12px 16px;background:#f9fafb;border-radius:6px;width:50%;vertical-align:top;">
                <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Pages Viewed</div>
                <div style="font-size:14px;color:#111827;">${params.pagesLine}</div>
              </td>
              <td style="width:12px;"></td>
              <td style="padding:12px 16px;background:#f9fafb;border-radius:6px;width:50%;vertical-align:top;">
                <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Scores</div>
                <div style="font-size:14px;color:#111827;">${params.scoresLine}</div>
              </td>
            </tr>
          </table>

          ${params.techLine ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:6px;">
              <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Tech Stack</div>
              <div style="font-size:14px;color:#111827;">${params.techLine}</div>
            </td></tr>
          </table>` : ''}

          ${params.aiSummary ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr><td style="padding:12px 16px;background:#f0f9ff;border-radius:6px;border:1px solid #bae6fd;">
              <div style="font-size:11px;font-weight:600;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">AI Account Intelligence</div>
              <div style="font-size:13px;color:#1e3a5f;line-height:1.6;">${params.aiSummary}</div>
            </td></tr>
          </table>` : ''}

          <div style="border-left:3px solid #FF725C;padding:12px 16px;background:#FEF7F6;border-radius:0 6px 6px 0;">
            <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Suggested Opener</div>
            <div style="font-size:14px;color:#111827;font-style:italic;">"${params.draftOpener}"</div>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none;">
          <span style="font-size:11px;color:#9ca3af;">Sent by Traceable — Visitor Intelligence & Sales Alerting</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      session_id?: string;
      urgency?: string;
      is_repeat?: boolean;
    };

    const { session_id, urgency = 'medium', is_repeat = false } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Stage 1: Load all relevant data
    // ------------------------------------------------------------------

    // Session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
    }

    // Score
    const { data: scoreRow } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('session_id', session_id)
      .single();

    // Load company — prefer company_id FK, then domain lookups
    const sessionTyped = session as Session;
    let company: EnrichedCompany | null = null;
    let companyDomain: string | null = null;

    if (sessionTyped.company_id) {
      const { data: companyRow } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', sessionTyped.company_id)
        .single();
      if (companyRow) {
        company = companyRow as EnrichedCompany;
        companyDomain = company.domain ?? null;
      }
    }

    if (!company) {
      companyDomain = sessionTyped.identity?.domain ?? scoreRow?.company_domain ?? null;
      if (companyDomain) {
        const { data: companyRow } = await supabaseAdmin
          .from('companies')
          .select('*')
          .eq('domain', companyDomain)
          .single();
        if (companyRow) company = companyRow as EnrichedCompany;
      }
    }

    // ------------------------------------------------------------------
    // Stage 2: Extract key data for message assembly
    // ------------------------------------------------------------------

    const pages: PageVisit[] = sessionTyped.pages ?? [];
    const pageCounts = countPageVisits(pages);
    const totalDurationSeconds = pages.reduce(
      (acc, p) => acc + (p.duration_seconds ?? 0),
      0
    );

    const contacts: EnrichedContact[] = company?.contacts ?? [];
    const leadContact = pickLeadContact(contacts);

    const techStack: string[] = (company?.tech_stack ?? []).map((t) =>
      typeof t === 'string' ? t : (t as { name: string }).name ?? ''
    ).filter(Boolean);

    const intentScore: number = scoreRow?.score ?? 0;
    const fitScore: number = scoreRow?.fit_score ?? 0;
    const leadScore: number = scoreRow?.lead_score ?? 0;

    // ------------------------------------------------------------------
    // Stage 3: Generate draft opener (no blank placeholders guaranteed)
    // ------------------------------------------------------------------

    const draftOpener = generateDraftOpener({
      contactName: leadContact?.name,
      contactTitle: leadContact?.title,
      companyName: company?.name,
      pagesVisited: pages,
      intentScore,
    });

    // ------------------------------------------------------------------
    // Stage 4: Build Slack Block Kit payload
    // ------------------------------------------------------------------

    const slackBlocks = buildSlackBlocks({
      companyName: company?.name,
      industry: company?.industry,
      employeeCount: company?.employee_count,
      hqCity: company?.hq_city,
      hqCountry: company?.hq_country,
      contact: leadContact,
      pageCounts,
      totalDurationSeconds,
      intentScore,
      fitScore,
      leadScore,
      techStack,
      draftOpener,
      sessionId: session_id,
      contactLinkedinUrl: leadContact?.linkedin_url,
      urgency,
      isRepeat: is_repeat,
    });

    // ------------------------------------------------------------------
    // Stage 5: Send to Slack
    // ------------------------------------------------------------------

    let slackSent = false;

    if (SLACK_WEBHOOK_URL) {
      try {
        const slackRes = await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks: slackBlocks }),
        });

        if (slackRes.ok) {
          slackSent = true;
        } else {
          console.error('[send] Slack webhook HTTP error:', slackRes.status);
        }
      } catch (slackErr) {
        console.error('[send] Slack webhook fetch error:', slackErr);
      }
    } else {
      console.warn('[send] SLACK_WEBHOOK_URL not set — skipping Slack');
    }

    // ------------------------------------------------------------------
    // Stage 6: SendGrid fallback if Slack failed
    // ------------------------------------------------------------------

    let emailSent = false;

    if (!slackSent) {
      const metaParts: string[] = [];
      if (company?.industry) metaParts.push(company.industry);
      if (company?.employee_count)
        metaParts.push(`${company.employee_count.toLocaleString()} employees`);
      const location = [company?.hq_city, company?.hq_country]
        .filter(Boolean)
        .join(', ');
      if (location) metaParts.push(location);

      const contactLineParts: string[] = [];
      if (leadContact?.name) contactLineParts.push(leadContact.name);
      if (leadContact?.title) contactLineParts.push(leadContact.title);

      const subject = company?.name
        ? `[${urgency === 'high' ? 'High Intent' : 'Medium Intent'}] ${company.name} is on your site`
        : `[${urgency === 'high' ? 'High Intent' : 'Medium Intent'}] New high-intent visitor detected`;

      emailSent = await sendEmailFallback({
        subject,
        htmlBody: buildEmailHtml({
          companyName: company?.name,
          metaLine: metaParts.join(' | '),
          contactLine: contactLineParts.join(', '),
          pagesLine: formatPageList(pageCounts),
          scoresLine: `Intent: ${intentScore} | Fit: ${fitScore} | Lead: ${leadScore}`,
          techLine: techStack.slice(0, 6).join(', '),
          draftOpener,
          urgency,
          isRepeat: is_repeat,
          aiSummary: (company as Record<string, unknown> | null)?.ai_summary as string | null | undefined,
        }),
      });
    }

    // ------------------------------------------------------------------
    // Stage 7: Insert alert record into Supabase alerts table
    // ------------------------------------------------------------------

    const { data: alertRow, error: alertInsertError } = await supabaseAdmin
      .from('alerts')
      .insert({
        session_id,
        company_id: company
          ? ((company as unknown as Record<string, unknown>).id as string | undefined)
          : (sessionTyped.company_id ?? undefined),
        score: intentScore,
        lead_score: leadScore,
        slack_sent: slackSent,
        email_sent: emailSent,
        status: slackSent || emailSent ? 'sent' : 'failed',
        created_at: new Date().toISOString(),
        metadata: {
          urgency,
          is_repeat,
          buyer_stage: scoreRow?.buyer_stage,
          draft_opener: draftOpener,
        },
      })
      .select('id')
      .single();

    if (alertInsertError) {
      console.error('[send] Supabase alert insert failed:', alertInsertError);
    }

    // ------------------------------------------------------------------
    // Stage 8: Return result
    // ------------------------------------------------------------------

    return NextResponse.json({
      alert_id: alertRow?.id ?? null,
      slack_sent: slackSent,
      email_sent: emailSent,
      urgency,
      is_repeat,
    });
  } catch (err) {
    console.error('[send] Unhandled error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
