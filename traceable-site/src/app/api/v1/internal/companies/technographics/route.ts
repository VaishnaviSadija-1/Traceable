/**
 * POST /api/v1/internal/companies/technographics
 *
 * Detects a company's tech stack using Apify's Wappalyzer actor.
 * Caches results in the `companies` Supabase table (TTL: 30 days).
 *
 * Body: { company_domain: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runActor } from '@/lib/apify';

const CACHE_TTL_DAYS = 30;

interface TechEntry {
  name: string;
  category: string;
  confidence: number;
}

// website-technology-detector actor output shape
interface WappalyzerResult {
  domain?: string;
  url?: string;
  technology_names?: string[];
  technologies_by_category?: Record<string, string[]>;
  status?: string;
}

function isStale(fetchedAt: string): boolean {
  return Date.now() - new Date(fetchedAt).getTime() > CACHE_TTL_DAYS * 864e5;
}

async function fetchViaApify(domain: string): Promise<TechEntry[] | null> {
  try {
    // Actor: website-technology-detector (KqwoVq4eSHnaBYVXX)
    const results = await runActor<WappalyzerResult>(
      'KqwoVq4eSHnaBYVXX',
      { domains: [domain] },
      60
    );

    if (!results.length || results[0].status !== 'success') return null;

    const result = results[0];
    const entries: TechEntry[] = [];

    // technologies_by_category: { "Analytics": ["GA4", "Segment"], ... }
    const byCategory = result.technologies_by_category ?? {};
    for (const [category, names] of Object.entries(byCategory)) {
      for (const name of names) {
        if (name) entries.push({ name, category, confidence: 90 });
      }
    }

    return entries.length > 0 ? entries : null;
  } catch (err) {
    console.error('[technographics] Apify Wappalyzer failed:', err);
    return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { company_domain?: string };
    const { company_domain } = body;

    if (!company_domain) {
      return NextResponse.json({ error: 'company_domain is required' }, { status: 400 });
    }

    // Stage 1: Cache check
    const { data: cached } = await supabaseAdmin
      .from('companies')
      .select('tech_stack, enriched_at')
      .eq('domain', company_domain)
      .single();

    if (
      cached?.tech_stack &&
      Array.isArray(cached.tech_stack) &&
      cached.tech_stack.length > 0 &&
      cached.enriched_at &&
      !isStale(cached.enriched_at)
    ) {
      return NextResponse.json({ tech_stack: cached.tech_stack, cached: true, source: 'cache' });
    }

    // Stage 2: Apify Wappalyzer actor
    const techStack = await fetchViaApify(company_domain);

    if (!techStack) {
      return NextResponse.json({ tech_stack: [], cached: false, source: 'none', error: 'tech_lookup_failed' });
    }

    // Stage 3: Deduplicate by name — keep highest confidence
    const deduped = new Map<string, TechEntry>();
    for (const entry of techStack) {
      const existing = deduped.get(entry.name);
      if (!existing || entry.confidence > existing.confidence) {
        deduped.set(entry.name, entry);
      }
    }
    const normalized = Array.from(deduped.values());

    // Stage 4: Cache in Supabase
    await supabaseAdmin
      .from('companies')
      .upsert({ domain: company_domain, tech_stack: normalized, enriched_at: new Date().toISOString() }, { onConflict: 'domain' });

    return NextResponse.json({ tech_stack: normalized, cached: false, source: 'apify-wappalyzer' });
  } catch (err) {
    console.error('[technographics] Unhandled error:', err);
    return NextResponse.json({ error: 'internal_error', tech_stack: [] }, { status: 500 });
  }
}
