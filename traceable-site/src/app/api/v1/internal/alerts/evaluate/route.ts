/**
 * POST /api/v1/internal/alerts/evaluate
 *
 * Determines whether a session should trigger a sales alert.
 * Implements dedup suppression (24h window) and score thresholds.
 *
 * Body: { session_id: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const DEDUP_WINDOW_HOURS = 24;
const MIN_LEAD_SCORE = 40;
const HIGH_INTENT_THRESHOLD = 70;

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { session_id?: string };
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // Stage 1: Load session score from scores table
    // ------------------------------------------------------------------
    const { data: scoreRow, error: scoreError } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (scoreError || !scoreRow) {
      return NextResponse.json(
        { error: 'score_not_found', should_alert: false },
        { status: 404 }
      );
    }

    const leadScore: number = scoreRow.lead_score ?? 0;
    const intentScore: number = scoreRow.score ?? 0;
    const companyId: string | null = scoreRow.company_id ?? null;
    const companyDomain: string | null = scoreRow.company_domain ?? null;

    // ------------------------------------------------------------------
    // Stage 2: Score gate — bail out early if lead score is too low
    // ------------------------------------------------------------------
    if (leadScore < MIN_LEAD_SCORE) {
      return NextResponse.json({
        should_alert: false,
        reason: 'score_too_low',
        lead_score: leadScore,
      });
    }

    // ------------------------------------------------------------------
    // Stage 3: Dedup check — has this company been alerted in last 24h?
    // ------------------------------------------------------------------
    let isRepeat = false;
    let recentAlertScore: number | null = null;

    if (companyId) {
      const cutoff = new Date(
        Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000
      ).toISOString();

      const { data: recentAlerts } = await supabaseAdmin
        .from('alerts')
        .select('id, score, lead_score, created_at')
        .eq('company_id', companyId)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentAlerts && recentAlerts.length > 0) {
        isRepeat = true;
        recentAlertScore = recentAlerts[0].lead_score ?? recentAlerts[0].score ?? null;
      }
    }

    // ------------------------------------------------------------------
    // Stage 4: Dedup suppression logic
    // ------------------------------------------------------------------
    if (isRepeat) {
      if (leadScore < HIGH_INTENT_THRESHOLD) {
        // Duplicate within 24h AND not high-intent enough — suppress
        return NextResponse.json({
          should_alert: false,
          reason: 'duplicate_suppressed',
          lead_score: leadScore,
          previous_alert_score: recentAlertScore,
        });
      }
      // Duplicate but score >= 70 — allow through, mark as repeat
    }

    // ------------------------------------------------------------------
    // Stage 5: Determine urgency
    // ------------------------------------------------------------------
    const urgency: 'high' | 'medium' = intentScore >= HIGH_INTENT_THRESHOLD
      ? 'high'
      : 'medium';

    // ------------------------------------------------------------------
    // Stage 6: Return approval with full context
    // ------------------------------------------------------------------
    return NextResponse.json({
      should_alert: true,
      urgency,
      is_repeat: isRepeat,
      score_data: {
        session_id,
        lead_score: leadScore,
        intent_score: intentScore,
        fit_score: scoreRow.fit_score ?? 0,
        buyer_stage: scoreRow.buyer_stage ?? 'unknown',
        company_domain: companyDomain,
        computed_at: scoreRow.computed_at,
      },
    });
  } catch (err) {
    console.error('[evaluate] Unhandled error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
