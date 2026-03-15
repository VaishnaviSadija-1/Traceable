/**
 * CompanyEnrich API Client
 *
 * Base URL: https://api.companyenrich.com
 * Auth:     Authorization: Bearer <COMPANYENRICH_API_KEY>
 * Docs:     https://docs.companyenrich.com/
 */

const BASE = 'https://api.companyenrich.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.COMPANYENRICH_API_KEY ?? ''}`,
    'Content-Type': 'application/json',
  };
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface CompanyEnrichResponse {
  id?: string;
  name?: string;
  domain?: string;
  website?: string;
  type?: string; // 'private' | 'public' | 'nonprofit' | etc.
  industry?: string;
  industries?: string[];
  categories?: string[]; // e.g. ['b2b', 'saas']
  employees?: string; // range: '1-10' | '11-50' | '51-200' | '201-500' | '501-1K' | '1K-5K' | '5K-10K' | 'over-10K'
  revenue?: string; // range: 'under-1m' | '1m-10m' | '10m-50m' | '50m-200m' | '200m-1b' | 'over-1b'
  description?: string;
  seo_description?: string;
  keywords?: string[];
  technologies?: string[];
  founded_year?: number;
  naics_codes?: string[];
  subsidiaries?: unknown;
  logo_url?: string;
  page_rank?: number;
  updated_at?: string;
  location?: {
    country?: { code?: string; name?: string; latitude?: number; longitude?: number };
    state?: { id?: number; name?: string; code?: string };
    city?: { id?: number; name?: string };
    address?: string;
    postal_code?: string;
    phone?: string;
  };
  financial?: {
    stock_symbol?: string;
    stock_exchange?: string;
    total_funding?: number;
    funding_stage?: string;
    funding_date?: string;
    funding?: Array<{
      date?: string;
      amount?: number | null;
      type?: string;
      url?: string | null;
      from?: string | null;
    }>;
  };
  socials?: {
    linkedin_url?: string;
    linkedin_id?: string;
    twitter_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    angellist_url?: string;
    crunchbase_url?: string;
    youtube_url?: string;
    github_url?: string;
    g2_url?: string;
  };
}

// ---------------------------------------------------------------------------
// Employee range → approximate headcount
// ---------------------------------------------------------------------------

const EMPLOYEE_RANGE_MAP: Record<string, number> = {
  '1-10':     5,
  '11-50':    30,
  '51-200':   125,
  '201-500':  350,
  '501-1K':   750,
  '1K-5K':    2500,
  '5K-10K':   7500,
  'over-10K': 10000,
};

export function employeeRangeToCount(range?: string): number | undefined {
  if (!range) return undefined;
  return EMPLOYEE_RANGE_MAP[range];
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Enrich a company by domain. Returns null on any error or non-200. */
export async function fetchCompanyEnrich(domain: string): Promise<CompanyEnrichResponse | null> {
  try {
    const res = await fetch(
      `${BASE}/companies/enrich?domain=${encodeURIComponent(domain)}`,
      { headers: headers() }
    );
    if (!res.ok) {
      console.warn(`[companyenrich] HTTP ${res.status} for ${domain}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[companyenrich] fetch error:', err);
    return null;
  }
}
