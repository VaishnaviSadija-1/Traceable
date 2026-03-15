/**
 * Business Signals via Perplexity Sonar Pro (OpenRouter)
 *
 * Given company context, researches recent business signals:
 *   hiring activity, funding, market expansion, product launches, partnerships
 *
 * Follows same pattern as src/lib/perplexity.ts
 */

import type { CompanyContext } from './perplexity';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL    = 'perplexity/sonar-pro';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SignalType = 'hiring' | 'funding' | 'expansion' | 'product_launch' | 'partnership';

export interface BusinessSignal {
  type:        SignalType;
  title:       string;
  detail:      string;
  date?:       string | null;
  source_url?: string | null;
}

export interface BusinessSignalsResult {
  signals:   BusinessSignal[];
  citations: string[];
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a B2B sales intelligence researcher with access to the web.
Your job is to find RECENT business signals for a company that indicate growth, change, or opportunity.

Signal categories:
- hiring: Active job postings, team expansion, new leadership hires (type: hiring)
- funding: Fundraising rounds, IPO activity, valuation changes (type: funding)
- expansion: New markets, geographies, verticals, office openings (type: expansion)
- product_launch: New products, features, platform updates (type: product_launch)
- partnership: Strategic partnerships, integrations, acquisitions (type: partnership)

Rules:
- Search the web for up-to-date information. Check news, press releases, LinkedIn, Crunchbase.
- Return ONLY valid JSON — no markdown, no prose, no explanation.
- Every field in the schema must be present. Use null for any field you cannot find.
- Only include signals from the last 12 months.
- Return 3-6 signals. If you cannot find enough, return fewer rather than guessing.
- For date: use approximate format like "2025-03" or "Q1 2026". Use null if unknown.
- For source_url: include the URL where you found the information. Use null if unknown.`;

function buildUserPrompt(ctx: CompanyContext): string {
  const lines = [
    `Find recent business signals for this company:`,
    ``,
    `Company: ${ctx.name ?? ctx.domain}`,
    `Domain: ${ctx.domain}`,
    ctx.industry       ? `Industry: ${ctx.industry}`                      : null,
    ctx.description    ? `Description: ${ctx.description.slice(0, 300)}`  : null,
    ctx.employee_count ? `Employees: ~${ctx.employee_count}`              : null,
    ctx.revenue_range  ? `Revenue: ${ctx.revenue_range}`                  : null,
    ctx.hq_city        ? `HQ: ${ctx.hq_city}, ${ctx.hq_country ?? ''}`   : null,
    ctx.founded_year   ? `Founded: ${ctx.founded_year}`                   : null,
  ].filter(Boolean).join('\n');

  return `${lines}

Return JSON in this EXACT shape (include all fields, use null if unknown):
{
  "signals": [
    {
      "type":       "hiring",
      "title":      "Expanding Engineering Team",
      "detail":     "Posted 20+ engineering roles on LinkedIn in Q1 2026",
      "date":       "2026-01",
      "source_url": "https://example.com/article"
    }
  ]
}`;
}

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

export async function fetchBusinessSignals(
  ctx: CompanyContext
): Promise<BusinessSignalsResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    console.warn('[business-signals] OPENROUTER_API_KEY not configured');
    return null;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://traceable.app',
        'X-Title':      'Traceable Business Signals',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: buildUserPrompt(ctx) },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[business-signals] HTTP ${res.status}:`, errText.slice(0, 200));
      return null;
    }

    const json = await res.json();
    const content: string  = json.choices?.[0]?.message?.content ?? '';
    const citations: string[] = json.citations ?? [];

    // Strip markdown code fences if model wraps output
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed: { signals?: unknown[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn('[business-signals] JSON parse failed. Raw content:', cleaned.slice(0, 400));
      return null;
    }

    const signals: BusinessSignal[] = (parsed.signals ?? [])
      .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
      .map((s) => ({
        type:       validateSignalType(s.type),
        title:      String(s.title ?? '').trim(),
        detail:     String(s.detail ?? '').trim(),
        date:       (s.date       as string | null) ?? null,
        source_url: (s.source_url as string | null) ?? null,
      }))
      .filter((s) => s.title && s.detail);

    return { signals, citations };
  } catch (err) {
    console.warn('[business-signals] fetch error:', err);
    return null;
  }
}

function validateSignalType(v: unknown): SignalType {
  const valid: SignalType[] = ['hiring', 'funding', 'expansion', 'product_launch', 'partnership'];
  return valid.includes(v as SignalType) ? (v as SignalType) : 'hiring';
}
