/**
 * Dashboard data queries — server-only.
 * All queries use supabaseAdmin (service-role) to bypass RLS.
 */

import { getSupabaseAdmin } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types for query results
// ---------------------------------------------------------------------------

export interface OverviewMetrics {
  activeSessions: number;
  visitorsToday: number;
  companiesIdentified: number;
  alertsSentToday: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
}

export interface SessionRow {
  id: string;
  visitor_id: string | null;
  ip: string | null;
  user_agent: string | null;
  referrer: string | null;
  landing_url: string;
  pages: unknown[];
  identity_id: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  companies?: CompanyRow | null;
  scores?: ScoreRow[] | null;
  identities?: IdentityRow | null;
}

export interface CompanyRow {
  id: string;
  domain: string | null;
  name: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  org: string | null;
  industry: string | null;
  employee_count: number | null;
  revenue_range: string | null;
  hq_city: string | null;
  hq_country: string | null;
  tech_stack: unknown[];
  contacts: unknown[];
  confidence: string;
  enriched_at: string | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
}

export interface ScoreRow {
  id: string;
  session_id: string;
  company_id: string | null;
  score: number;
  fit_score: number;
  lead_score: number;
  buyer_stage: string;
  pages_visited: unknown[];
  repeat_visit: boolean;
  high_intent_pages: number;
  session_duration_secs: number | null;
  persona?: string | null;
  persona_confidence?: number | null;
  persona_signals?: string[] | null;
  computed_at: string;
  created_at: string;
}

export interface IdentityRow {
  id: string;
  session_id: string | null;
  source: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  linkedin_url: string | null;
  title: string | null;
  company_name: string | null;
  company_domain: string | null;
  location: string | null;
  country: string | null;
  created_at: string;
}

export interface AlertRow {
  id: string;
  session_id: string;
  company_id: string | null;
  score: number;
  lead_score: number | null;
  status: string;
  slack_sent: boolean;
  email_sent: boolean;
  metadata: unknown;
  created_at: string;
  companies?: CompanyRow | null;
}

export interface EventRow {
  id: string;
  session_id: string;
  event_type: string;
  page_url: string;
  page_category: string;
  metadata: unknown;
  duration_seconds: number | null;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const db = getSupabaseAdmin();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

  const [active, visitors, companies, alerts] = await Promise.all([
    db.from("sessions").select("*", { count: "exact", head: true }).gte("updated_at", fifteenMinAgo),
    db.from("sessions").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    db.from("sessions").select("company_id", { count: "exact", head: true }).not("company_id", "is", null).gte("created_at", todayStart),
    db.from("alerts").select("*", { count: "exact", head: true }).eq("status", "sent").gte("created_at", todayStart),
  ]);

  return {
    activeSessions: active.count ?? 0,
    visitorsToday: visitors.count ?? 0,
    companiesIdentified: companies.count ?? 0,
    alertsSentToday: alerts.count ?? 0,
  };
}

export async function getRecentHighIntentSessions(limit = 10) {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("scores")
    .select(`
      *,
      sessions!inner (id, visitor_id, landing_url, created_at, company_id),
      companies (id, name, domain)
    `)
    .gte("score", 60)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentHighIntentSessions error:", error);
    return [];
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

interface GetSessionsParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getSessions(params: GetSessionsParams = {}): Promise<PaginatedResult<SessionRow>> {
  const db = getSupabaseAdmin();
  const { page = 1, pageSize = 20, sort = "newest", search, dateFrom, dateTo } = params;
  const offset = (page - 1) * pageSize;

  let query = db
    .from("sessions")
    .select("*, companies(id, name, domain)", { count: "exact" });

  if (search) {
    query = query.or(`visitor_id.ilike.%${search}%,landing_url.ilike.%${search}%,ip.ilike.%${search}%`);
  }
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("getSessions error:", error);
    return { data: [], totalCount: 0 };
  }

  const sessions = (data ?? []) as SessionRow[];

  // Fetch scores separately for reliability — join can fail silently
  if (sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    const { data: scoresData } = await db
      .from("scores")
      .select("session_id, score, lead_score, buyer_stage, persona, persona_confidence")
      .in("session_id", sessionIds);

    if (scoresData && scoresData.length > 0) {
      const scoresMap = new Map<string, typeof scoresData>();
      for (const sc of scoresData) {
        const existing = scoresMap.get(sc.session_id) ?? [];
        existing.push(sc);
        scoresMap.set(sc.session_id, existing);
      }
      for (const session of sessions) {
        (session as unknown as Record<string, unknown>).scores = scoresMap.get(session.id) ?? [];
      }
    }
  }

  return { data: sessions, totalCount: count ?? 0 };
}

export async function getSessionDetail(id: string) {
  const db = getSupabaseAdmin();

  const [sessionResult, eventsResult, scoresResult, identitiesResult] = await Promise.all([
    db
      .from("sessions")
      .select("*, companies(*)")
      .eq("id", id)
      .single(),
    db
      .from("session_events")
      .select("*")
      .eq("session_id", id)
      .order("timestamp", { ascending: true }),
    db
      .from("scores")
      .select("*")
      .eq("session_id", id),
    db
      .from("identities")
      .select("*")
      .eq("session_id", id)
      .limit(1),
  ]);

  if (sessionResult.error) {
    console.error("getSessionDetail error:", sessionResult.error);
    return null;
  }

  const session = sessionResult.data as SessionRow & { identities: IdentityRow | null; scores: ScoreRow[] | null };
  session.scores = (scoresResult.data as ScoreRow[]) ?? [];
  session.identities = (identitiesResult.data?.[0] as IdentityRow) ?? null;

  return {
    session,
    events: (eventsResult.data as EventRow[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

interface GetCompaniesParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
  industry?: string;
}

export async function getCompanies(params: GetCompaniesParams = {}): Promise<PaginatedResult<CompanyRow>> {
  const db = getSupabaseAdmin();
  const { page = 1, pageSize = 20, sort = "newest", search, industry } = params;
  const offset = (page - 1) * pageSize;

  let query = db.from("companies").select("*", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%`);
  }
  if (industry) {
    query = query.eq("industry", industry);
  }

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "last_seen") {
    query = query.order("last_seen_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("getCompanies error:", error);
    return { data: [], totalCount: 0 };
  }

  return { data: (data as CompanyRow[]) ?? [], totalCount: count ?? 0 };
}

export async function getCompanyDetail(id: string) {
  const db = getSupabaseAdmin();

  const [companyResult, sessionsResult, scoresResult] = await Promise.all([
    db.from("companies").select("*").eq("id", id).single(),
    db
      .from("sessions")
      .select("id, visitor_id, landing_url, created_at, pages")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("scores")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (companyResult.error) {
    console.error("getCompanyDetail error:", companyResult.error);
    return null;
  }

  return {
    company: companyResult.data as CompanyRow,
    sessions: (sessionsResult.data ?? []) as SessionRow[],
    scores: (scoresResult.data ?? []) as ScoreRow[],
  };
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

interface GetAlertsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getAlerts(params: GetAlertsParams = {}): Promise<PaginatedResult<AlertRow>> {
  const db = getSupabaseAdmin();
  const { page = 1, pageSize = 20, status, dateFrom, dateTo } = params;
  const offset = (page - 1) * pageSize;

  let query = db
    .from("alerts")
    .select("*, companies(id, name, domain)", { count: "exact" });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("getAlerts error:", error);
    return { data: [], totalCount: 0 };
  }

  return { data: (data as AlertRow[]) ?? [], totalCount: count ?? 0 };
}

// ---------------------------------------------------------------------------
// Emails Sent
// ---------------------------------------------------------------------------

export interface EmailRow {
  id: string;
  type: string;
  subject: string;
  recipient: string;
  company_id: string | null;
  session_id: string | null;
  alert_id: string | null;
  status: string;
  metadata: unknown;
  created_at: string;
  companies?: { id: string; name: string | null; domain: string | null } | null;
}

interface GetEmailsParams {
  page?: number;
  pageSize?: number;
  type?: string;
}

export async function getEmails(params: GetEmailsParams = {}): Promise<PaginatedResult<EmailRow>> {
  const db = getSupabaseAdmin();
  const { page = 1, pageSize = 20, type } = params;
  const offset = (page - 1) * pageSize;

  let query = db
    .from("emails_sent")
    .select("*, companies(id, name, domain)", { count: "exact" });

  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("getEmails error:", error);
    return { data: [], totalCount: 0 };
  }

  return { data: (data as EmailRow[]) ?? [], totalCount: count ?? 0 };
}

export async function getEmailStats() {
  const db = getSupabaseAdmin();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [total, today, digest, alerts] = await Promise.all([
    db.from("emails_sent").select("*", { count: "exact", head: true }),
    db.from("emails_sent").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    db.from("emails_sent").select("*", { count: "exact", head: true }).eq("type", "daily_digest"),
    db.from("emails_sent").select("*", { count: "exact", head: true }).eq("type", "alert"),
  ]);

  return {
    total: total.count ?? 0,
    today: today.count ?? 0,
    digests: digest.count ?? 0,
    alerts: alerts.count ?? 0,
  };
}
