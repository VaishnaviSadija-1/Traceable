/**
 * Shared TypeScript types for Traceable — visitor intelligence & sales alerting.
 * Used across API routes, lib utilities, and Supabase queries.
 */

// ---------------------------------------------------------------------------
// Page & Session
// ---------------------------------------------------------------------------

export type PageCategory = 'pricing' | 'sales-agent' | 'case-studies' | 'other';

export interface PageVisit {
  page_url: string;
  page_category: PageCategory;
  entered_at: string; // ISO timestamp
  duration_seconds?: number;
  scroll_depth?: number; // 0–100 percentage
}

export interface Session {
  id: string; // UUID
  visitor_id?: string; // client-provided anonymous ID (e.g. from localStorage)
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  ip: string | null; // server-extracted IP, never client-provided
  user_agent?: string;
  referrer?: string;
  landing_url: string;
  pages: PageVisit[];
  identity?: CompanyIdentity;
  company_id?: string; // FK → companies.id
}

export interface SessionEvent {
  session_id: string;
  event_type: string; // e.g. 'page_view', 'click', 'scroll', 'form_submit'
  page_url: string;
  page_category?: PageCategory;
  metadata?: Record<string, unknown>;
  timestamp: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// RB2B Webhook
// ---------------------------------------------------------------------------

export interface RB2BPayload {
  person?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    linkedin_url?: string;
    title?: string;
    company?: string;
    company_domain?: string;
    company_linkedin_url?: string;
    location?: string;
    country?: string;
  };
  // RB2B may include session context
  visitor_id?: string;
  ip?: string;
  page_url?: string;
  referrer?: string;
  timestamp?: string;
  // Raw webhook body — keep for debugging
  raw?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// IPInfo API
// ---------------------------------------------------------------------------

export interface IPInfoResponse {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string; // "lat,lng"
  org?: string; // e.g. "AS12345 Cloudflare, Inc."
  postal?: string;
  timezone?: string;
  company?: {
    name?: string;
    domain?: string;
    type?: string; // 'business' | 'isp' | 'hosting' | 'education' | 'government'
  };
  bogon?: boolean;
}

// ---------------------------------------------------------------------------
// Identity Resolution
// ---------------------------------------------------------------------------

export type IdentitySource = 'rb2b' | 'ipinfo';
export type IdentityConfidence = 'high' | 'medium' | 'low';

export interface CompanyIdentity {
  domain?: string;
  name?: string;
  source: IdentitySource;
  confidence: IdentityConfidence;
  rb2b_person?: RB2BPayload['person'];
  ipinfo_data?: IPInfoResponse;
}

// ---------------------------------------------------------------------------
// Apollo / Enrichment
// ---------------------------------------------------------------------------

export interface EnrichedContact {
  name?: string;
  email?: string;
  title?: string;
  linkedin_url?: string;
  seniority?: string;
  department?: string;
}

export interface EnrichedCompany {
  name?: string;
  domain?: string;
  industry?: string;
  employee_count?: number;
  revenue_range?: string;
  hq_city?: string;
  hq_country?: string;
  description?: string;
  tech_stack?: string[];
  contacts?: EnrichedContact[];
  funding_stage?: string;
  founded_year?: number;
  linkedin_url?: string;
  enriched_at?: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Intent Scoring
// ---------------------------------------------------------------------------

export type BuyerStage = 'awareness' | 'consideration' | 'decision' | 'unknown';
export type IntentStage = 'Research' | 'Awareness' | 'Evaluation' | 'Decision';

export interface IntentScore {
  score: number; // 0–100
  score_out_of_10: number; // 0.0–10.0 (for display: "8.4 / 10")
  intent_stage: IntentStage;
  buyer_stage: BuyerStage;
  fit_score: number; // 0–100 ICP fit
  lead_score: number; // 0–100 composite
  pages_visited: PageCategory[];
  repeat_visit: boolean;
  multi_person: boolean; // multiple people from same company
  high_intent_pages: number; // count of pricing/sales-agent visits
  session_duration_seconds?: number;
  computed_at: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Persona Inference
// ---------------------------------------------------------------------------

export interface PersonaInference {
  likely_persona: string; // e.g. "Head of Sales Operations"
  confidence: number; // 0–100
  signals: string[]; // what behavior led to this inference
}

// ---------------------------------------------------------------------------
// Recommended Sales Actions
// ---------------------------------------------------------------------------

export interface SalesAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Daily Digest (combined output per visitor/company)
// ---------------------------------------------------------------------------

export interface DigestEntry {
  session_id: string;
  company_name?: string;
  company_domain?: string;
  industry?: string;
  employee_count?: number;
  contact_name?: string;
  contact_title?: string;
  contact_linkedin?: string;
  intent_score_display: string; // "8.4 / 10"
  intent_stage: IntentStage;
  persona: PersonaInference;
  recommended_actions: SalesAction[];
  pages_summary: string;
  total_time_seconds: number;
  is_repeat: boolean;
  multi_person: boolean;
  ai_summary?: string | null;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export type AlertStatus = 'pending' | 'sent' | 'suppressed' | 'failed';

export interface Alert {
  id: string; // UUID
  session_id: string;
  company_id?: string;
  score: number; // IntentScore.score
  lead_score?: number;
  status: AlertStatus;
  slack_sent: boolean;
  email_sent: boolean;
  created_at: string; // ISO timestamp
  metadata?: Record<string, unknown>; // extra context for debugging
}

// ---------------------------------------------------------------------------
// API Request / Response shapes
// ---------------------------------------------------------------------------

export interface StartSessionRequest {
  visitor_id?: string;
  landing_url: string;
  referrer?: string;
  user_agent?: string;
}

export interface StartSessionResponse {
  session_id: string;
  created_at: string;
}

export interface SessionEventRequest {
  session_id: string;
  event_type: string;
  page_url: string;
  metadata?: Record<string, unknown>;
}

export interface SessionEventResponse {
  ok: boolean;
}

export interface IdentityResolveRequest {
  session_id: string;
  ip: string;
}

export interface IdentityResolveResponse {
  identity: CompanyIdentity | null;
  company_id?: string;
}
