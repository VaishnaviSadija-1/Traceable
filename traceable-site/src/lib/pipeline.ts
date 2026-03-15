/**
 * Automated pipeline orchestrator.
 *
 * Chains: score → enrich → evaluate → send → track email
 * Called fire-and-forget from session events (page_leave)
 * and from session start (after company identification).
 */

import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function callInternal(path: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[pipeline] ${path} failed (${res.status}):`, text.slice(0, 200));
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[pipeline] ${path} fetch error:`, err);
    return null;
  }
}

/**
 * Resolve a company domain from its name using Perplexity.
 * Used when IPInfo gives us a company name but no domain.
 */
async function resolveDomainFromName(companyName: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://traceable.app',
        'X-Title': 'Traceable Domain Resolver',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You resolve company names to their primary website domain. Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: `What is the primary website domain for "${companyName}"? Return JSON: {"domain": "example.com"}\nIf unknown, return: {"domain": null}`,
          },
        ],
        temperature: 0.0,
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? '';
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed.domain ?? null;
  } catch {
    return null;
  }
}

/**
 * Run the full scoring + alerting pipeline for a session.
 * Safe to call multiple times — scoring upserts, alerts dedup.
 */
export async function runPipeline(sessionId: string): Promise<void> {
  const db = getSupabaseAdmin();

  // Step 1: Score the session
  const scoreResult = await callInternal("/api/v1/internal/sessions/score", {
    session_id: sessionId,
  });

  if (!scoreResult || scoreResult.error) {
    console.warn("[pipeline] Scoring failed for session:", sessionId);
    return;
  }

  // Step 2: Check if session has a company — trigger enrichment if needed
  const { data: session } = await db
    .from("sessions")
    .select("company_id")
    .eq("id", sessionId)
    .single();

  if (session?.company_id) {
    const { data: company } = await db
      .from("companies")
      .select("id, name, domain, enriched_at")
      .eq("id", session.company_id)
      .single();

    if (company && !company.enriched_at) {
      let domain = company.domain;

      // If company has no domain, try to resolve it from the name
      if (!domain && company.name) {
        domain = await resolveDomainFromName(company.name);
        if (domain) {
          // Save the resolved domain to the company
          await db
            .from("companies")
            .update({ domain })
            .eq("id", company.id);
        }
      }

      if (domain) {
        // Trigger enrichment (chains to contact enrichment internally)
        await callInternal("/api/v1/internal/companies/enrich", {
          company_domain: domain,
        });

        // Re-score after enrichment so fit score includes company data
        await callInternal("/api/v1/internal/sessions/score", {
          session_id: sessionId,
        });
      }
    }
  }

  // Step 3: Evaluate if alert should fire
  const evalResult = await callInternal("/api/v1/internal/alerts/evaluate", {
    session_id: sessionId,
  });

  if (!evalResult || !evalResult.should_alert) {
    return;
  }

  // Step 4: Send alert
  const sendResult = await callInternal("/api/v1/internal/alerts/send", {
    session_id: sessionId,
    urgency: evalResult.urgency,
    is_repeat: evalResult.is_repeat,
  });

  // Step 5: Track email in emails_sent table
  if (sendResult?.email_sent && sendResult.alert_id) {
    try {
      const { data: sessionData } = await db
        .from("sessions")
        .select("company_id")
        .eq("id", sessionId)
        .single();

      await db.from("emails_sent").insert({
        type: "alert",
        subject: `[${evalResult.urgency === "high" ? "High Intent" : "Medium Intent"}] Alert for session ${sessionId}`,
        recipient: process.env.SALES_TEAM_EMAIL ?? process.env.ALERT_EMAIL ?? "unknown",
        company_id: sessionData?.company_id ?? null,
        session_id: sessionId,
        alert_id: sendResult.alert_id,
        status: "sent",
        metadata: {
          urgency: evalResult.urgency,
          is_repeat: evalResult.is_repeat,
          intent_score: scoreResult.intent_score,
          lead_score: scoreResult.lead_score,
        },
      });
    } catch (err) {
      console.warn("[pipeline] Failed to track email:", err);
    }
  }
}
