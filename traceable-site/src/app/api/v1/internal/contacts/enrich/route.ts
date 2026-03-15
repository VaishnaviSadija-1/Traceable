/**
 * POST /api/v1/internal/contacts/enrich
 *
 * Enriches contacts for a company using Perplexity Sonar Pro (via OpenRouter).
 * Feeds all enriched company data from Supabase as context so Perplexity
 * can do targeted web research to find:
 *   CEO/Founder · VP Sales · Head of Marketing · RevOps leaders
 *
 * Upserts results into the `contacts` table (keyed on company_id + full_name).
 * Body: { company_domain: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchContactsForCompany } from '@/lib/perplexity';
import type { CompanyContext } from '@/lib/perplexity';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { company_domain?: string };
    const { company_domain } = body;

    if (!company_domain) {
      return NextResponse.json({ error: 'company_domain is required' }, { status: 400 });
    }

    // Stage 1: Pull full enriched company record from Supabase
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select(
        'id, domain, name, industry, org, employee_count, revenue_range, ' +
        'hq_city, hq_country, tech_stack, founded_year, linkedin_url'
      )
      .eq('domain', company_domain)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .single() as any;

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'company_not_found', detail: 'Run /companies/enrich first' },
        { status: 404 }
      );
    }

    if (!company.name) {
      return NextResponse.json(
        { error: 'company_not_enriched', detail: 'Company record has no name — run /companies/enrich first' },
        { status: 422 }
      );
    }

    // Stage 2: Build context object from Supabase data
    const ctx: CompanyContext = {
      domain:         company.domain,
      name:           company.name,
      industry:       company.industry,
      description:    company.org,          // `org` stores the company description
      employee_count: company.employee_count,
      revenue_range:  company.revenue_range,
      hq_city:        company.hq_city,
      hq_country:     company.hq_country,
      tech_stack:     company.tech_stack,
      founded_year:   company.founded_year,
    };

    // Stage 3: Fetch contacts from Perplexity Sonar Pro
    const result = await fetchContactsForCompany(ctx);

    if (!result || result.contacts.length === 0) {
      return NextResponse.json({
        contacts:   [],
        found:      0,
        company_id: company.id,
        message:    'No contacts found by Perplexity',
      });
    }

    // Stage 4: Upsert into contacts table
    const now = new Date().toISOString();
    const rows = result.contacts.map((c) => ({
      company_id:     company.id,
      company_domain: company_domain,
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

    const { data: upserted, error: upsertError } = await supabaseAdmin
      .from('contacts')
      .upsert(rows, { onConflict: 'company_id,full_name' })
      .select('id, full_name, title, role_type, email, linkedin_url, seniority');

    if (upsertError) {
      console.error('[contacts/enrich] Supabase upsert error:', upsertError);
      return NextResponse.json(
        { error: 'db_error', detail: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contacts:   upserted,
      found:      upserted?.length ?? 0,
      company_id: company.id,
      citations:  result.citations,
    });
  } catch (err) {
    console.error('[contacts/enrich] Unhandled error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
