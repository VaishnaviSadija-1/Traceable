/**
 * POST /api/v1/internal/companies/enrich
 *
 * Enriches a company using CompanyEnrich (single API call):
 *   GET /companies/enrich?domain= → firmographics, tech stack, funding, socials
 *
 * After a fresh enrichment, automatically triggers contact enrichment
 * (Perplexity Sonar Pro via OpenRouter) in the background — no extra call needed.
 *
 * Caches results in `companies` Supabase table (TTL: 7 days).
 * Body: { company_domain: string, session_id?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchCompanyEnrich, employeeRangeToCount } from '@/lib/companyenrich';
import { fetchContactsForCompany } from '@/lib/perplexity';
import type { EnrichedCompany } from '@/types';
import type { CompanyContext } from '@/lib/perplexity';

const CACHE_TTL_DAYS = 7;

function isStale(enrichedAt: string): boolean {
  return Date.now() - new Date(enrichedAt).getTime() > CACHE_TTL_DAYS * 864e5;
}

async function enrichContacts(companyId: string, ctx: CompanyContext): Promise<void> {
  try {
    const result = await fetchContactsForCompany(ctx);
    if (!result || result.contacts.length === 0) {
      console.log(`[enrich] No contacts found for ${ctx.domain}`);
      return;
    }

    const now = new Date().toISOString();
    const rows = result.contacts.map((c) => ({
      company_id:     companyId,
      company_domain: ctx.domain,
      full_name:      c.full_name,
      first_name:     c.first_name,
      last_name:      c.last_name,
      title:          c.title,
      role_type:      c.role_type,
      seniority:      c.seniority,
      department:     c.department,
      email:          c.email,
      linkedin_url:   c.linkedin_url,
      source:         'perplexity' as const,
      raw:            c,
      enriched_at:    now,
    }));

    const { error } = await supabaseAdmin
      .from('contacts')
      .upsert(rows, { onConflict: 'company_id,full_name' });

    if (error) {
      console.error(`[enrich] Contact upsert error for ${ctx.domain}:`, error);
    } else {
      console.log(`[enrich] Saved ${rows.length} contacts for ${ctx.domain}`);
    }
  } catch (err) {
    // Never let contact enrichment crash the main response
    console.error(`[enrich] Contact enrichment failed for ${ctx.domain}:`, err);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { company_domain?: string; session_id?: string };
    const { company_domain } = body;

    if (!company_domain) {
      return NextResponse.json({ error: 'company_domain is required' }, { status: 400 });
    }

    // Stage 1: Supabase cache check
    const { data: cached, error: cacheError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('domain', company_domain)
      .single();

    if (!cacheError && cached?.enriched_at && !isStale(cached.enriched_at)) {
      return NextResponse.json({ company: cached as EnrichedCompany, cached: true, partial: false });
    }

    // Stage 2: Call CompanyEnrich
    const data = await fetchCompanyEnrich(company_domain);

    if (!data) {
      return NextResponse.json({ error: 'enrichment_failed', partial: true }, { status: 502 });
    }

    // Stage 3: Build EnrichedCompany
    const enrichedAt = new Date().toISOString();

    const company: EnrichedCompany = {
      domain:         company_domain,
      name:           data.name,
      description:    data.description ?? data.seo_description,
      industry:       data.industry,
      employee_count: employeeRangeToCount(data.employees),
      revenue_range:  data.revenue,
      hq_city:        data.location?.city?.name,
      hq_country:     data.location?.country?.name,
      linkedin_url:   data.socials?.linkedin_url,
      founded_year:   data.founded_year,
      tech_stack:     data.technologies ?? [],
      funding_stage:  data.financial?.funding_stage,
      contacts:       [],
      enriched_at:    enrichedAt,
    };

    const partial = !company.name || !company.industry;

    // Stage 4: Upsert company into Supabase
    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from('companies')
      .upsert(
        {
          domain:         company_domain,
          name:           company.name,
          industry:       company.industry,
          employee_count: company.employee_count,
          revenue_range:  company.revenue_range,
          hq_city:        company.hq_city,
          hq_country:     company.hq_country,
          org:            company.description,
          tech_stack:     company.tech_stack,
          contacts:       [],
          linkedin_url:   company.linkedin_url,
          founded_year:   company.founded_year,
          enriched_at:    enrichedAt,
          last_seen_at:   enrichedAt,
          apollo_raw:     data,
        },
        { onConflict: 'domain' }
      )
      .select('id')
      .single();

    if (upsertError) {
      console.error('[enrich] Supabase upsert error:', upsertError);
    }

    // Stage 5: Kick off contact enrichment in background (non-blocking)
    if (!partial && upserted?.id) {
      const ctx: CompanyContext = {
        domain:         company_domain,
        name:           company.name,
        industry:       company.industry,
        description:    company.description,
        employee_count: company.employee_count,
        revenue_range:  company.revenue_range,
        hq_city:        company.hq_city,
        hq_country:     company.hq_country,
        tech_stack:     company.tech_stack as string[],
        founded_year:   company.founded_year,
      };
      // Fire and forget — response returns immediately, contacts save in background
      enrichContacts(upserted.id, ctx).catch(() => {});
    }

    return NextResponse.json({
      company: {
        ...company,
        logo:       data.logo_url,
        categories: data.categories,
        keywords:   data.keywords,
        socials:    data.socials,
        funding: {
          total:  data.financial?.total_funding,
          stage:  data.financial?.funding_stage,
          date:   data.financial?.funding_date,
          rounds: data.financial?.funding ?? [],
        },
      },
      cached:  false,
      partial,
      sources: ['companyenrich.com/companies/enrich', 'perplexity/sonar-pro'],
    });
  } catch (err) {
    console.error('[enrich] Unhandled error:', err);
    return NextResponse.json({ error: 'internal_error', partial: true }, { status: 500 });
  }
}
