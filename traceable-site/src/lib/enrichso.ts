/**
 * Enrich.so Company Enrichment Client
 *
 * Base URL: https://api.enrich.so/v1/api
 * Auth:     Authorization: Bearer <token>
 * Docs:     https://docs.enrich.so/
 */

const BASE = 'https://api.enrich.so/v1/api';

function headers() {
  return {
    Authorization: `Bearer ${process.env.ENRICHSO_API_KEY ?? ''}`,
    'Content-Type': 'application/json',
  };
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface EnrichSOCompany {
  // Core — from /company
  name?: string;
  universal_name?: string;
  domain?: string;
  description?: string;
  tagline?: string;
  founded?: string;
  type?: string;
  phone?: string;
  followers?: number;
  industries?: string[];
  specialities?: string[];
  hashtags?: string[];
  images?: { logo?: string; cover?: string };
  urls?: { company_page?: string; li_url?: string };
  staff?: { total?: number; range?: string };
  locations?: {
    headquarter?: {
      city?: string;
      country?: string;
      countryCode?: string;
      geographicArea?: string;
      postalCode?: string;
      street1?: string;
    };
    other?: unknown[];
  };
  funding_data?: {
    total?: number;
    rounds?: Array<{
      round?: string;
      date?: string;
      amount?: number;
      investors?: string[];
    }>;
  };

  // Extended — from /company-funding-plus
  legalName?: string;
  shortDescription?: string;
  totalFundingRaised?: number;
  lastFundingRoundType?: string;
  lastFundingRoundDate?: string;
  numberOfInvestors?: number;
  knownInvestors?: string[];
  keyPersonnel?: {
    founders?: Array<{ name?: string; title?: string }>;
    ceo?: { name?: string; title?: string };
    executives?: Array<{ name?: string; title?: string }>;
  };
  websiteTraffic?: { monthlyVisits?: number; monthlyVisitsPctChange?: number };
  itSpending?: { estimatedITSpend?: number; currency?: string };
  contactInformation?: { email?: string; phone?: string };

  // Revenue — from /company-revenue-plus
  revenue?: number;
  employeeCount?: number;
  ceo?: { fullName?: string; designation?: string };
  competitors?: Array<{
    name?: string;
    website?: string;
    revenue?: number;
    employeeCount?: number;
    headquarters?: string;
  }>;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Core company profile: name, description, industry, HQ, staff, funding */
export async function fetchCompany(domain: string): Promise<EnrichSOCompany | null> {
  try {
    const res = await fetch(`${BASE}/company?domain=${encodeURIComponent(domain)}`, {
      headers: headers(),
    });
    if (!res.ok) {
      console.warn(`[enrich.so] /company HTTP ${res.status} for ${domain}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[enrich.so] /company error:', err);
    return null;
  }
}

/** Extended: leadership, funding rounds, traffic, IT spend */
export async function fetchFundingPlus(domain: string): Promise<EnrichSOCompany | null> {
  try {
    const res = await fetch(`${BASE}/company-funding-plus?domain=${encodeURIComponent(domain)}`, {
      headers: headers(),
    });
    if (!res.ok) {
      console.warn(`[enrich.so] /company-funding-plus HTTP ${res.status} for ${domain}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[enrich.so] /company-funding-plus error:', err);
    return null;
  }
}

/** Revenue, employee count, CEO, competitors */
export async function fetchRevenuePlus(domain: string): Promise<EnrichSOCompany | null> {
  try {
    const res = await fetch(`${BASE}/company-revenue-plus?domain=${encodeURIComponent(domain)}`, {
      headers: headers(),
    });
    if (!res.ok) {
      console.warn(`[enrich.so] /company-revenue-plus HTTP ${res.status} for ${domain}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[enrich.so] /company-revenue-plus error:', err);
    return null;
  }
}

/** Merge all three responses into a single flat object */
export function mergeEnrichData(...sources: (EnrichSOCompany | null)[]): EnrichSOCompany {
  const merged: EnrichSOCompany = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [k, v] of Object.entries(source)) {
      if (v !== null && v !== undefined && v !== '') {
        (merged as Record<string, unknown>)[k] = v;
      }
    }
  }
  return merged;
}
