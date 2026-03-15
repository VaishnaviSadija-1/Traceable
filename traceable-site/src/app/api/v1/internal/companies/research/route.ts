/**
 * POST /api/v1/internal/companies/research
 *
 * Accepts an array of company names, resolves domains, enriches each,
 * and returns structured account intelligence.
 *
 * Body: { companies: string[] }   (max 5)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchCompanyEnrich, employeeRangeToCount } from '@/lib/companyenrich';
import { fetchContactsForCompany } from '@/lib/perplexity';
import { fetchBusinessSignals } from '@/lib/business-signals';
import { generateAccountSummary } from '@/lib/account-intelligence';
import type { CompanyContext } from '@/lib/perplexity';

// ---------------------------------------------------------------------------
// Hardcoded domain overrides — bypass Perplexity for known ambiguous names
// ---------------------------------------------------------------------------

const DOMAIN_OVERRIDES: Record<string, string> = {
  fello: 'fello.ai',
};

// ---------------------------------------------------------------------------
// Domain resolution via Perplexity
// ---------------------------------------------------------------------------

async function resolveDomain(companyName: string): Promise<string | null> {
  const key = companyName.trim().toLowerCase();
  if (DOMAIN_OVERRIDES[key]) return DOMAIN_OVERRIDES[key];

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://traceable.app',
        'X-Title':      'Traceable Domain Resolver',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You resolve company names to their primary website domain. Return ONLY valid JSON with no markdown or explanation.',
          },
          {
            role: 'user',
            content: `What is the primary website domain for the company "${companyName}"?\n\nReturn JSON: {"domain": "example.com", "name": "Official Company Name"}\n\nIf the company does not exist or you cannot find it, return: {"domain": null, "name": null}`,
          },
        ],
        temperature: 0.0,
      }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? '';
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return parsed.domain ?? null;
  } catch {
    console.warn(`[research] Domain resolution failed for "${companyName}"`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Research result shape
// ---------------------------------------------------------------------------

interface ResearchResult {
  input_name:       string;
  domain:           string | null;
  name:             string | null;
  industry:         string | null;
  description:      string | null;
  employee_count:   number | null;
  employee_range:   string | null;
  revenue_range:    string | null;
  hq_city:          string | null;
  hq_country:       string | null;
  founded_year:     number | null;
  tech_stack:       string[];
  funding_stage:    string | null;
  total_funding:    number | null;
  contacts:         Array<Record<string, unknown>>;
  business_signals: Array<Record<string, unknown>>;
  ai_summary:       string | null;
  company_id:       string | null;
  logo_url:         string | null;
  socials:          Record<string, unknown> | null;
  error?:           string;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { companies?: string[] };
    const companyNames = body.companies;

    if (!companyNames || !Array.isArray(companyNames) || companyNames.length === 0) {
      return NextResponse.json({ error: 'companies array is required' }, { status: 400 });
    }

    if (companyNames.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 companies per request' }, { status: 400 });
    }

    const results: ResearchResult[] = [];

    for (const inputName of companyNames) {
      const name = inputName.trim();
      if (!name) continue;

      const result: ResearchResult = {
        input_name: name,
        domain: null,
        name: null,
        industry: null,
        description: null,
        employee_count: null,
        employee_range: null,
        revenue_range: null,
        hq_city: null,
        hq_country: null,
        founded_year: null,
        tech_stack: [],
        funding_stage: null,
        total_funding: null,
        contacts: [],
        business_signals: [],
        ai_summary: null,
        company_id: null,
        logo_url: null,
        socials: null,
      };

      try {
        // Step 1: Resolve domain
        const domain = await resolveDomain(name);
        if (!domain) {
          result.error = 'Could not resolve domain';
          results.push(result);
          continue;
        }
        result.domain = domain;

        // Step 2: Enrich via CompanyEnrich
        const enrichData = await fetchCompanyEnrich(domain);
        if (enrichData) {
          result.name = enrichData.name ?? name;
          result.industry = enrichData.industry ?? null;
          result.description = enrichData.description ?? enrichData.seo_description ?? null;
          result.employee_count = employeeRangeToCount(enrichData.employees) ?? null;
          result.employee_range = enrichData.employees ?? null;
          result.revenue_range = enrichData.revenue ?? null;
          result.hq_city = enrichData.location?.city?.name ?? null;
          result.hq_country = enrichData.location?.country?.name ?? null;
          result.founded_year = enrichData.founded_year ?? null;
          result.tech_stack = enrichData.technologies ?? [];
          result.funding_stage = enrichData.financial?.funding_stage ?? null;
          result.total_funding = enrichData.financial?.total_funding ?? null;
          result.logo_url = enrichData.logo_url ?? null;
          result.socials = enrichData.socials ?? null;
        } else {
          result.name = name;
        }

        // Build CompanyContext for downstream calls
        const ctx: CompanyContext = {
          domain,
          name:           result.name,
          industry:       result.industry,
          description:    result.description,
          employee_count: result.employee_count,
          revenue_range:  result.revenue_range,
          hq_city:        result.hq_city,
          hq_country:     result.hq_country,
          tech_stack:     result.tech_stack,
          founded_year:   result.founded_year,
        };

        // Steps 3-5: Run contacts, business signals, and AI summary in parallel
        const [contactsResult, signalsResult, summaryResult] = await Promise.allSettled([
          fetchContactsForCompany(ctx),
          fetchBusinessSignals(ctx),
          generateAccountSummary({
            companyName: result.name ?? name,
            domain,
            industry: result.industry,
            employeeCount: result.employee_count,
            revenueRange: result.revenue_range,
            hqCity: result.hq_city,
            hqCountry: result.hq_country,
            techStack: result.tech_stack,
            totalSessions: 0,
            pagesVisited: [],
            highIntentPages: 0,
            repeatVisitor: false,
          }),
        ]);

        if (contactsResult.status === 'fulfilled' && contactsResult.value) {
          result.contacts = contactsResult.value.contacts as unknown as Array<Record<string, unknown>>;
        }

        if (signalsResult.status === 'fulfilled' && signalsResult.value) {
          result.business_signals = signalsResult.value.signals as unknown as Array<Record<string, unknown>>;
        }

        if (summaryResult.status === 'fulfilled' && summaryResult.value) {
          result.ai_summary = summaryResult.value;
        }

        // Step 6: Upsert to Supabase
        const enrichedAt = new Date().toISOString();
        const { data: upserted } = await supabaseAdmin
          .from('companies')
          .upsert(
            {
              domain,
              name:             result.name,
              industry:         result.industry,
              employee_count:   result.employee_count,
              revenue_range:    result.revenue_range,
              hq_city:          result.hq_city,
              hq_country:       result.hq_country,
              org:              result.description,
              tech_stack:       result.tech_stack,
              contacts:         result.contacts,
              business_signals: result.business_signals,
              ai_summary:       result.ai_summary,
              ai_summary_generated_at: result.ai_summary ? enrichedAt : null,
              enriched_at:      enrichedAt,
              last_seen_at:     enrichedAt,
              confidence:       enrichData ? 'high' : 'low',
            },
            { onConflict: 'domain' }
          )
          .select('id')
          .single();

        result.company_id = upserted?.id ?? null;
      } catch (err) {
        result.error = String(err);
      }

      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('[research] Unhandled error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
