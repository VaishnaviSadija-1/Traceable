/**
 * Perplexity Sonar Pro via OpenRouter — Contact Enrichment
 *
 * Given enriched company data from Supabase, uses Perplexity's web-search
 * grounded model to find current key personnel:
 *   CEO/Founder, VP Sales, Head of Marketing, RevOps leaders
 *
 * Endpoint: POST https://openrouter.ai/api/v1/chat/completions
 * Model:    perplexity/sonar-pro
 * Auth:     Authorization: Bearer <OPENROUTER_API_KEY>
 */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL    = 'perplexity/sonar-pro';

// ---------------------------------------------------------------------------
// Strict contact schema — every field always present, null if not found
// ---------------------------------------------------------------------------

export type RoleType = 'ceo_founder' | 'vp_sales' | 'head_of_marketing' | 'revops' | 'other';

export interface PerplexityContact {
  full_name:    string;
  first_name:   string | null;
  last_name:    string | null;
  title:        string | null;
  role_type:    RoleType;
  seniority:    string | null;
  department:   string | null;
  email:        string | null;
  linkedin_url: string | null;
}

export interface PerplexityResult {
  contacts:  PerplexityContact[];
  citations: string[];
}

// ---------------------------------------------------------------------------
// Company context shape (from Supabase companies row)
// ---------------------------------------------------------------------------

export interface CompanyContext {
  domain:         string;
  name?:          string | null;
  industry?:      string | null;
  description?:   string | null;
  employee_count?: number | null;
  revenue_range?: string | null;
  hq_city?:       string | null;
  hq_country?:    string | null;
  tech_stack?:    string[] | null;
  founded_year?:  number | null;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a B2B sales intelligence researcher with access to the web.
Your job is to find the CURRENT key personnel at a company who are relevant for sales outreach.

Target roles:
- CEO or Founder (role_type: ceo_founder)
- VP of Sales or Chief Revenue Officer (role_type: vp_sales)
- Head of Marketing or CMO or VP Marketing (role_type: head_of_marketing)
- RevOps, Revenue Operations, or Sales Operations leader (role_type: revops)

Rules:
- Search the web for up-to-date information. Check LinkedIn, company website, Crunchbase, news.
- Return ONLY valid JSON — no markdown, no prose, no explanation.
- Every field in the schema must be present. Use null for any field you cannot find.
- Do NOT guess emails. Only include email if you find it from a public source.
- For linkedin_url: only include if you are highly confident it is the correct person's profile.
- If a role cannot be found, omit that person entirely rather than returning partial/guessed data.
- Return at most one person per role_type.`;

function buildUserPrompt(ctx: CompanyContext): string {
  const lines = [
    `Find the current key sales-relevant personnel at this company:`,
    ``,
    `Company: ${ctx.name ?? ctx.domain}`,
    `Domain: ${ctx.domain}`,
    ctx.industry      ? `Industry: ${ctx.industry}`                      : null,
    ctx.description   ? `Description: ${ctx.description.slice(0, 300)}`  : null,
    ctx.employee_count? `Employees: ~${ctx.employee_count}`               : null,
    ctx.revenue_range ? `Revenue: ${ctx.revenue_range}`                  : null,
    ctx.hq_city       ? `HQ: ${ctx.hq_city}, ${ctx.hq_country ?? ''}`   : null,
    ctx.founded_year  ? `Founded: ${ctx.founded_year}`                   : null,
  ].filter(Boolean).join('\n');

  return `${lines}

Return JSON in this EXACT shape (include all fields, use null if unknown):
{
  "contacts": [
    {
      "full_name":    "Jane Smith",
      "first_name":   "Jane",
      "last_name":    "Smith",
      "title":        "Chief Executive Officer",
      "role_type":    "ceo_founder",
      "seniority":    "c-suite",
      "department":   "executive",
      "email":        null,
      "linkedin_url": "https://www.linkedin.com/in/janesmith"
    }
  ]
}`;
}

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

export async function fetchContactsForCompany(
  ctx: CompanyContext
): Promise<PerplexityResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    console.warn('[perplexity] OPENROUTER_API_KEY not configured');
    return null;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://traceable.app',
        'X-Title':      'Traceable Contact Enrichment',
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
      console.warn(`[perplexity] HTTP ${res.status}:`, errText.slice(0, 200));
      return null;
    }

    const json = await res.json();
    const content: string  = json.choices?.[0]?.message?.content ?? '';
    const citations: string[] = json.citations ?? [];

    // Strip markdown code fences if model wraps output anyway
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed: { contacts?: unknown[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn('[perplexity] JSON parse failed. Raw content:', cleaned.slice(0, 400));
      return null;
    }

    // Normalise — guarantee every field exists with null fallback
    const contacts: PerplexityContact[] = (parsed.contacts ?? [])
      .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
      .map((c) => ({
        full_name:    String(c.full_name   ?? '').trim() || null as unknown as string,
        first_name:   (c.first_name   as string | null) ?? null,
        last_name:    (c.last_name    as string | null) ?? null,
        title:        (c.title        as string | null) ?? null,
        role_type:    validateRoleType(c.role_type),
        seniority:    (c.seniority    as string | null) ?? null,
        department:   (c.department   as string | null) ?? null,
        email:        (c.email        as string | null) ?? null,
        linkedin_url: (c.linkedin_url as string | null) ?? null,
      }))
      // Drop rows with no name
      .filter((c) => c.full_name);

    return { contacts, citations };
  } catch (err) {
    console.warn('[perplexity] fetch error:', err);
    return null;
  }
}

function validateRoleType(v: unknown): RoleType {
  const valid: RoleType[] = ['ceo_founder', 'vp_sales', 'head_of_marketing', 'revops', 'other'];
  return valid.includes(v as RoleType) ? (v as RoleType) : 'other';
}
