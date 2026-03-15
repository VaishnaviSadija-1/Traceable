/**
 * POST /api/v1/internal/sessions/score
 *
 * Computes intent, fit, and lead scores for a session.
 * Also infers visitor persona and generates recommended sales actions.
 * Upserts the result into the `scores` Supabase table.
 *
 * Body: { session_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type {
  Session,
  EnrichedCompany,
  EnrichedContact,
  IntentScore,
  IntentStage,
  BuyerStage,
  PageCategory,
  PersonaInference,
  SalesAction,
} from '@/types';

// ICP target industries for fit scoring
const TARGET_INDUSTRIES = new Set([
  'saas',
  'fintech',
  'enterprise software',
  'b2b',
  'financial technology',
  'software as a service',
]);

// ---------------------------------------------------------------------------
// Dwell-time helpers
// ---------------------------------------------------------------------------

interface PageDwellTime {
  page_url: string;
  page_category: PageCategory;
  total_seconds: number;
  visit_count: number;
}

/**
 * Aggregates dwell time per page from session_events (page_leave rows)
 * with the real duration_seconds column.
 */
async function getPageDwellTimes(sessionId: string): Promise<PageDwellTime[]> {
  const { data: events } = await supabaseAdmin
    .from('session_events')
    .select('page_url, page_category, duration_seconds')
    .eq('session_id', sessionId)
    .eq('event_type', 'page_leave')
    .not('duration_seconds', 'is', null);

  if (!events || events.length === 0) return [];

  const map = new Map<string, PageDwellTime>();
  for (const e of events) {
    const key = e.page_url;
    const existing = map.get(key);
    if (existing) {
      existing.total_seconds += e.duration_seconds ?? 0;
      existing.visit_count += 1;
    } else {
      map.set(key, {
        page_url: e.page_url,
        page_category: e.page_category as PageCategory,
        total_seconds: e.duration_seconds ?? 0,
        visit_count: 1,
      });
    }
  }

  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Multi-person detection
// ---------------------------------------------------------------------------

/**
 * Checks whether other sessions from the same company exist (different visitor_id).
 * Returns { isMultiPerson, companySessionCount }.
 */
async function detectMultiPerson(
  session: Session,
  companyDomain: string | null
): Promise<{ isMultiPerson: boolean; companySessionCount: number }> {
  if (!companyDomain) return { isMultiPerson: false, companySessionCount: 1 };

  // Find other sessions that resolved to the same company domain
  const { data: otherSessions } = await supabaseAdmin
    .from('sessions')
    .select('id, visitor_id')
    .neq('id', session.id)
    .not('visitor_id', 'is', null);

  if (!otherSessions || otherSessions.length === 0) {
    return { isMultiPerson: false, companySessionCount: 1 };
  }

  // Check identity on those sessions — look for same company domain
  const { data: matchingSessions } = await supabaseAdmin
    .from('sessions')
    .select('id, visitor_id')
    .neq('id', session.id)
    .neq('visitor_id', session.visitor_id ?? '__none__')
    .contains('identity', { domain: companyDomain });

  const uniqueVisitors = new Set(
    (matchingSessions ?? []).map((s) => s.visitor_id).filter(Boolean)
  );

  return {
    isMultiPerson: uniqueVisitors.size > 0,
    companySessionCount: uniqueVisitors.size + 1,
  };
}

// ---------------------------------------------------------------------------
// Intent Score (revamped with dwell time)
// ---------------------------------------------------------------------------

function computeIntentScore(
  session: Session,
  dwellTimes: PageDwellTime[],
  isReturnVisit: boolean,
  isMultiPerson: boolean
): {
  intentScore: number;
  scoreOutOf10: number;
  intentStage: IntentStage;
  pagesVisited: PageCategory[];
  highIntentPages: number;
  totalDwellSeconds: number;
} {
  let score = 0;

  const pagesVisited = new Set<PageCategory>();
  let pricingDwell = 0;
  let salesAgentDwell = 0;
  let caseStudiesDwell = 0;
  let otherDwell = 0;
  let pricingVisits = 0;
  let salesAgentVisits = 0;
  let caseStudiesVisits = 0;

  for (const dwell of dwellTimes) {
    pagesVisited.add(dwell.page_category);
    switch (dwell.page_category) {
      case 'pricing':
        pricingDwell += dwell.total_seconds;
        pricingVisits += dwell.visit_count;
        break;
      case 'sales-agent':
        salesAgentDwell += dwell.total_seconds;
        salesAgentVisits += dwell.visit_count;
        break;
      case 'case-studies':
        caseStudiesDwell += dwell.total_seconds;
        caseStudiesVisits += dwell.visit_count;
        break;
      default:
        otherDwell += dwell.total_seconds;
    }
  }

  // Also count pages from session.pages if no dwell data yet
  if (dwellTimes.length === 0) {
    const pages = session.pages ?? [];
    for (const page of pages) {
      pagesVisited.add(page.page_category);
      switch (page.page_category) {
        case 'pricing': pricingVisits++; break;
        case 'sales-agent': salesAgentVisits++; break;
        case 'case-studies': caseStudiesVisits++; break;
      }
    }
  }

  const totalDwellSeconds = pricingDwell + salesAgentDwell + caseStudiesDwell + otherDwell;

  // --- Dwell-time weighted scoring ---
  // Pricing: highest signal. 30pts base + 1pt per second (capped at 30)
  if (pricingVisits > 0) score += 30;
  score += Math.min(Math.round(pricingDwell * 1), 30);

  // Sales-agent: strong signal. 15pts base + 0.5pt per second (capped at 15)
  if (salesAgentVisits > 0) score += 15;
  score += Math.min(Math.round(salesAgentDwell * 0.5), 15);

  // Case-studies: evaluation signal. 10pts base + 0.3pt per second (capped at 10)
  if (caseStudiesVisits > 0) score += 10;
  score += Math.min(Math.round(caseStudiesDwell * 0.3), 10);

  // General browsing: low signal. 0.1pt per second (capped at 5)
  score += Math.min(Math.round(otherDwell * 0.1), 5);

  // --- Behavioral multipliers ---
  // Long dwell on any high-intent page (>120s)
  if (pricingDwell > 120 || salesAgentDwell > 120) score += 10;

  // Return visit: strong buying signal
  if (isReturnVisit) score += 15;

  // Multi-person from same company: very strong signal
  if (isMultiPerson) score += 20;

  // Multiple high-intent pages visited
  const highIntentPageTypes = [pricingVisits > 0, salesAgentVisits > 0, caseStudiesVisits > 0].filter(Boolean).length;
  if (highIntentPageTypes >= 2) score += 10;

  const intentScore = Math.min(score, 100);
  const scoreOutOf10 = Math.round(intentScore / 10 * 10) / 10; // one decimal

  // --- Intent Stage ---
  let intentStage: IntentStage;
  if (intentScore >= 75) intentStage = 'Decision';
  else if (intentScore >= 50) intentStage = 'Evaluation';
  else if (intentScore >= 25) intentStage = 'Awareness';
  else intentStage = 'Research';

  return {
    intentScore,
    scoreOutOf10,
    intentStage,
    pagesVisited: Array.from(pagesVisited),
    highIntentPages: pricingVisits + salesAgentVisits,
    totalDwellSeconds,
  };
}

// ---------------------------------------------------------------------------
// Buyer Stage (kept for backwards compat)
// ---------------------------------------------------------------------------

function computeBuyerStage(intentScore: number, pagesVisited: PageCategory[]): BuyerStage {
  const visitedSet = new Set(pagesVisited);
  if (intentScore > 70 && visitedSet.has('pricing')) return 'decision';
  if (intentScore > 50 && visitedSet.has('case-studies')) return 'consideration';
  if (intentScore > 30) return 'awareness';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Fit Score
// ---------------------------------------------------------------------------

function computeFitScore(session: Session, company: EnrichedCompany | null): number {
  let score = 0;
  if (session.identity) score += 30;
  if (company) {
    const emp = company.employee_count ?? 0;
    if (emp >= 50 && emp <= 5000) score += 25;
    const industry = (company.industry ?? '').toLowerCase();
    if (TARGET_INDUSTRIES.has(industry)) score += 20;
    if (company.contacts && company.contacts.length > 0) score += 15;
    if (company.tech_stack && company.tech_stack.length > 0) score += 10;
  }
  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Persona Inference
// ---------------------------------------------------------------------------

function inferPersona(
  dwellTimes: PageDwellTime[],
  session: Session,
  company: EnrichedCompany | null
): PersonaInference {
  // If we have an actual title from RB2B identity, use it with high confidence
  const rb2bTitle = session.identity?.rb2b_person?.title;
  if (rb2bTitle) {
    return {
      likely_persona: rb2bTitle,
      confidence: 92,
      signals: ['Identity resolved via RB2B — verified title'],
    };
  }

  const signals: string[] = [];
  let persona = 'General Visitor';
  let confidence = 30;

  // Aggregate dwell by category
  const categoryDwell = new Map<PageCategory, number>();
  for (const d of dwellTimes) {
    categoryDwell.set(d.page_category, (categoryDwell.get(d.page_category) ?? 0) + d.total_seconds);
  }

  const pricingTime = categoryDwell.get('pricing') ?? 0;
  const salesAgentTime = categoryDwell.get('sales-agent') ?? 0;
  const caseStudiesTime = categoryDwell.get('case-studies') ?? 0;
  const otherTime = categoryDwell.get('other') ?? 0;
  const totalTime = pricingTime + salesAgentTime + caseStudiesTime + otherTime;

  // Determine dominant behavior
  const pricingRatio = totalTime > 0 ? pricingTime / totalTime : 0;
  const caseStudiesRatio = totalTime > 0 ? caseStudiesTime / totalTime : 0;
  const salesAgentRatio = totalTime > 0 ? salesAgentTime / totalTime : 0;

  if (pricingRatio > 0.4 || pricingTime > 60) {
    // Heavy pricing focus → buyer / decision maker
    if (salesAgentRatio > 0.2 || caseStudiesRatio > 0.2) {
      persona = 'VP of Sales / Head of Revenue';
      confidence = 78;
      signals.push(`High pricing page dwell (${pricingTime}s)`);
      signals.push('Cross-referenced sales-agent and case studies');
    } else {
      persona = 'Head of Procurement / Buying Committee Member';
      confidence = 72;
      signals.push(`Pricing page focus: ${Math.round(pricingRatio * 100)}% of session time`);
    }
  } else if (caseStudiesRatio > 0.4 || caseStudiesTime > 60) {
    // Case studies focus → evaluator
    persona = 'Head of Sales Operations';
    confidence = 68;
    signals.push(`Case studies dwell: ${caseStudiesTime}s`);
    signals.push('Evaluation-stage behavior — comparing solutions');
  } else if (salesAgentRatio > 0.4 || salesAgentTime > 60) {
    // Sales agent / product focus → technical evaluator
    persona = 'Sales Operations Manager / RevOps Lead';
    confidence = 65;
    signals.push(`Product page focus: ${salesAgentTime}s on sales-agent`);
  } else if (otherTime > 120 && pricingTime === 0) {
    // Long browse, no pricing → researcher
    persona = 'Industry Analyst / Researcher';
    confidence = 55;
    signals.push(`Long general browsing (${otherTime}s) with no pricing visits`);
    signals.push('Research-stage behavior');
  } else if (totalTime > 0) {
    // Mixed browsing
    persona = 'Business Stakeholder';
    confidence = 45;
    signals.push('Mixed page activity — no dominant pattern');
  }

  // Boost confidence if company data provides context
  if (company?.industry) {
    confidence = Math.min(confidence + 8, 95);
    signals.push(`Company industry: ${company.industry}`);
  }
  if (company?.employee_count && company.employee_count >= 50) {
    confidence = Math.min(confidence + 5, 95);
    signals.push(`Company size: ${company.employee_count} employees`);
  }

  return { likely_persona: persona, confidence, signals };
}

// ---------------------------------------------------------------------------
// Recommended Sales Actions
// ---------------------------------------------------------------------------

function generateSalesActions(
  intentScore: number,
  intentStage: IntentStage,
  persona: PersonaInference,
  company: EnrichedCompany | null,
  isMultiPerson: boolean,
  isReturnVisit: boolean,
  dwellTimes: PageDwellTime[]
): SalesAction[] {
  const actions: SalesAction[] = [];
  const companyName = company?.name ?? 'this company';

  // Multi-person → always flag
  if (isMultiPerson) {
    actions.push({
      action: `Multiple people from ${companyName} are evaluating — coordinate account-based outreach`,
      priority: 'high',
    });
  }

  // Decision stage actions
  if (intentStage === 'Decision') {
    actions.push({
      action: `High-intent visitor detected from ${companyName}. Prioritize immediate outreach`,
      priority: 'high',
    });

    if (company?.contacts && company.contacts.length > 0) {
      const leaders = company.contacts
        .filter((c) => /ceo|cto|vp|head|director|chief/i.test(c.title ?? ''))
        .slice(0, 2);
      if (leaders.length > 0) {
        const names = leaders.map((l) => `${l.name} (${l.title})`).join(', ');
        actions.push({
          action: `Reach out to decision makers: ${names}`,
          priority: 'high',
        });
      } else {
        actions.push({
          action: `Research VP Sales or RevOps leaders at ${companyName}`,
          priority: 'high',
        });
      }
    } else {
      actions.push({
        action: `Research VP Sales or RevOps leaders at ${companyName}`,
        priority: 'high',
      });
    }

    // Check for case-study relevance
    const hasCaseStudyTime = dwellTimes.some((d) => d.page_category === 'case-studies' && d.total_seconds > 10);
    if (hasCaseStudyTime && company?.industry) {
      actions.push({
        action: `Send personalized outreach referencing ${company.industry} case studies`,
        priority: 'high',
      });
    }

    actions.push({
      action: `Add ${companyName} to outbound campaign with personalized sequence`,
      priority: 'medium',
    });
  }

  // Evaluation stage
  if (intentStage === 'Evaluation') {
    actions.push({
      action: `Visitor from ${companyName} is actively evaluating — prepare tailored demo`,
      priority: 'high',
    });
    actions.push({
      action: `Share relevant case studies and ROI data with ${companyName}`,
      priority: 'medium',
    });
    if (isReturnVisit) {
      actions.push({
        action: `Return visitor — schedule follow-up call before they go with a competitor`,
        priority: 'high',
      });
    }
  }

  // Awareness stage
  if (intentStage === 'Awareness') {
    actions.push({
      action: `Add ${companyName} to nurture email campaign`,
      priority: 'medium',
    });
    actions.push({
      action: `Monitor for increased activity from ${companyName}`,
      priority: 'low',
    });
  }

  // Research stage
  if (intentStage === 'Research') {
    actions.push({
      action: `Low intent — add to long-term nurture list`,
      priority: 'low',
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { session_id?: string };
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    // Load session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
    }

    const sessionTyped = session as Session;

    // Load company — prefer company_id FK, fallback to identity.domain
    let company: EnrichedCompany | null = null;
    let companyDomain: string | null = null;

    if (sessionTyped.company_id) {
      const { data: companyRow } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', sessionTyped.company_id)
        .single();
      if (companyRow) {
        company = companyRow as EnrichedCompany;
        companyDomain = company.domain ?? null;
      }
    }

    // Fallback: try identity.domain (for RB2B-resolved sessions)
    if (!company) {
      const identity = sessionTyped.identity ?? null;
      companyDomain = identity?.domain ?? null;
      if (companyDomain) {
        const { data: companyRow } = await supabaseAdmin
          .from('companies')
          .select('*')
          .eq('domain', companyDomain)
          .single();
        if (companyRow) company = companyRow as EnrichedCompany;
      }
    }

    // Get dwell times from session_events
    const dwellTimes = await getPageDwellTimes(session_id);

    // Detect return visit — check for other sessions from the same company
    let isReturnVisit = false;
    const companyIdForLookup = sessionTyped.company_id ?? null;
    if (companyIdForLookup) {
      const { data: previousSessions } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('company_id', companyIdForLookup)
        .neq('id', session_id)
        .limit(1);
      isReturnVisit = !!(previousSessions && previousSessions.length > 0);
    } else if (companyDomain) {
      // Fallback for sessions linked by identity.domain
      const { data: previousSessions } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .neq('id', session_id)
        .contains('identity', { domain: companyDomain })
        .limit(1);
      isReturnVisit = !!(previousSessions && previousSessions.length > 0);
    }

    // Detect multi-person — check for different visitor_ids from same company
    let isMultiPerson = false;
    if (companyIdForLookup) {
      const { data: otherSessions } = await supabaseAdmin
        .from('sessions')
        .select('visitor_id')
        .eq('company_id', companyIdForLookup)
        .neq('id', session_id)
        .neq('visitor_id', sessionTyped.visitor_id ?? '__none__')
        .limit(1);
      isMultiPerson = !!(otherSessions && otherSessions.length > 0);
    } else {
      const result = await detectMultiPerson(sessionTyped, companyDomain);
      isMultiPerson = result.isMultiPerson;
    }

    // Compute scores
    const {
      intentScore,
      scoreOutOf10,
      intentStage,
      pagesVisited,
      highIntentPages,
      totalDwellSeconds,
    } = computeIntentScore(sessionTyped, dwellTimes, isReturnVisit, isMultiPerson);

    const buyerStage = computeBuyerStage(intentScore, pagesVisited);
    const fitScore = computeFitScore(sessionTyped, company);
    const leadScore = Math.round(intentScore * 0.6 + fitScore * 0.4);

    // Infer persona
    const persona = inferPersona(dwellTimes, sessionTyped, company);

    // Generate recommended actions
    const recommendedActions = generateSalesActions(
      intentScore,
      intentStage,
      persona,
      company,
      isMultiPerson,
      isReturnVisit,
      dwellTimes
    );

    // Upsert into scores table
    const computed_at = new Date().toISOString();

    const { error: upsertError } = await supabaseAdmin.from('scores').upsert(
      {
        session_id,
        company_id: sessionTyped.company_id ?? null,
        company_domain: companyDomain,
        score: intentScore,
        score_out_of_10: scoreOutOf10,
        intent_stage: intentStage,
        fit_score: fitScore,
        lead_score: leadScore,
        buyer_stage: buyerStage,
        pages_visited: pagesVisited,
        repeat_visit: isReturnVisit,
        multi_person: isMultiPerson,
        high_intent_pages: highIntentPages,
        session_duration_secs: totalDwellSeconds,
        persona: persona.likely_persona,
        persona_confidence: persona.confidence,
        persona_signals: persona.signals,
        recommended_actions: recommendedActions,
        computed_at,
      },
      { onConflict: 'session_id' }
    );

    if (upsertError) {
      console.error('[score] Supabase upsert failed:', upsertError);
    }

    return NextResponse.json({
      session_id,
      company_domain: companyDomain,
      intent_score: intentScore,
      score_display: `${scoreOutOf10} / 10`,
      intent_stage: intentStage,
      buyer_stage: buyerStage,
      fit_score: fitScore,
      lead_score: leadScore,
      persona,
      recommended_actions: recommendedActions,
      multi_person: isMultiPerson,
      repeat_visit: isReturnVisit,
      session_duration_seconds: totalDwellSeconds,
    });
  } catch (err) {
    console.error('[score] Unhandled error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
