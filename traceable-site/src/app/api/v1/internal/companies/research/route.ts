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
// Hardcoded company overrides — bypass all API calls for known companies
// ---------------------------------------------------------------------------

const COMPANY_OVERRIDES: Record<string, ResearchResult> = {
  fello: {
    input_name:     'Fello',
    domain:         'fello.ai',
    name:           'Fello',
    industry:       'Real Estate Technology (PropTech)',
    description:    'Fello is the only consumer engagement platform built to transform your existing database into a 24/7 sales engine. It helps real estate and mortgage professionals enrich their contact databases with property and behavioral data, automate personalized outreach, and convert leads using AI-powered scoring. Trusted by 20,000+ professionals, Fello has generated over 1M+ leads and discovered $10B+ in revenue for its customers.',
    employee_count: 75,
    employee_range: '51-100',
    revenue_range:  '$10M - $25M',
    hq_city:        null,
    hq_country:     'United States',
    founded_year:   null,
    tech_stack:     ['Amplitude', 'Next.js', 'React', 'Node.js', 'AI/ML', 'REST API'],
    funding_stage:  null,
    total_funding:  null,
    contacts:       [
      { name: 'Ryan Young', title: 'Founder & CEO', email: null, linkedin_url: null },
    ],
    business_signals: [
      { type: 'product_launch', title: 'AI-Powered Smart Send Feature', detail: 'Launched AI-driven email campaign optimization that personalizes messaging using property and engagement data.', date: '2025', source: 'https://fello.ai' },
      { type: 'expansion', title: 'Expanded to Mortgage Professionals', detail: 'Extended platform beyond real estate agents to serve mortgage professionals with database enrichment and lead scoring.', date: '2025', source: 'https://fello.ai' },
      { type: 'hiring', title: 'Growing Engineering & Sales Teams', detail: 'Actively hiring across engineering, product, and customer success to support 20,000+ user base.', date: '2025', source: 'https://fello.ai' },
    ],
    ai_summary:     'Fello is a PropTech SaaS platform founded by Ryan Young, a third-generation real estate professional who built the #1 team in Ohio and #15 nationally (WSJ RealTrends). The platform serves 20,000+ real estate and mortgage professionals with three core capabilities: database enrichment with property intelligence, AI-powered automated nurturing campaigns, and lead scoring for conversion optimization. Fello operates on a tiered subscription model starting at $165/mo (Starter) up to custom Enterprise pricing, with plans supporting 500 to 10,000+ marketing contacts. The company has facilitated over 1M+ leads and $10B+ in discovered revenue, earning a 5.0-star rating on G2.',
    company_id:     null,
    logo_url:       null,
    socials:        { linkedin: 'https://www.linkedin.com/company/felloai', instagram: 'https://www.instagram.com/fello.ai', facebook: 'https://www.facebook.com/felloai', youtube: 'https://www.youtube.com/@felloai' },
  },
};

// ---------------------------------------------------------------------------
// Domain resolution via Perplexity
// ---------------------------------------------------------------------------

async function resolveDomain(companyName: string): Promise<string | null> {
  const key = companyName.trim().toLowerCase();
  if (COMPANY_OVERRIDES[key]) return COMPANY_OVERRIDES[key].domain;

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

      // Check for hardcoded override — skip all API calls
      const overrideKey = name.toLowerCase();
      if (COMPANY_OVERRIDES[overrideKey]) {
        const override = { ...COMPANY_OVERRIDES[overrideKey], input_name: name };
        // Still upsert to Supabase so it appears in the dashboard
        try {
          const enrichedAt = new Date().toISOString();
          const { data: upserted } = await supabaseAdmin
            .from('companies')
            .upsert(
              {
                domain:           override.domain,
                name:             override.name,
                industry:         override.industry,
                employee_count:   override.employee_count,
                revenue_range:    override.revenue_range,
                hq_city:          override.hq_city,
                hq_country:       override.hq_country,
                org:              override.description,
                tech_stack:       override.tech_stack,
                contacts:         override.contacts,
                business_signals: override.business_signals,
                ai_summary:       override.ai_summary,
                ai_summary_generated_at: override.ai_summary ? enrichedAt : null,
                enriched_at:      enrichedAt,
                last_seen_at:     enrichedAt,
                confidence:       'high',
              },
              { onConflict: 'domain' }
            )
            .select('id')
            .single();
          override.company_id = upserted?.id ?? null;
        } catch { /* upsert is best-effort */ }
        results.push(override);
        continue;
      }

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
