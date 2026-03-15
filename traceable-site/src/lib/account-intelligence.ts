/**
 * AI Account Intelligence Summary Generator
 *
 * Uses OpenAI GPT-4.1 Mini to generate a concise research summary
 * about a company based on enriched data + browsing behavior from Traceable.
 *
 * Output example:
 *   "Acme Mortgage is a mid-sized lender operating in Texas.
 *    Recent browsing behavior indicates evaluation of AI sales automation tools.
 *    Multiple visits to pricing and case studies suggest strong purchase intent."
 */

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4.1-mini";

export interface AccountIntelligenceContext {
  // Company data
  companyName: string;
  domain: string;
  industry?: string | null;
  employeeCount?: number | null;
  revenueRange?: string | null;
  hqCity?: string | null;
  hqCountry?: string | null;
  techStack?: string[] | null;

  // Browsing behavior from Traceable
  totalSessions: number;
  pagesVisited: string[]; // page categories or URLs
  highIntentPages: number; // count of pricing/case-study visits
  latestScore?: number | null;
  buyerStage?: string | null;
  repeatVisitor: boolean;
  totalTimeSeconds?: number | null;
}

const SYSTEM_PROMPT = `You are a B2B sales intelligence analyst. Generate a concise account intelligence summary (3-5 sentences) about a company based on the provided company data and website browsing behavior.

Rules:
- Write in a professional, factual tone suitable for a sales team briefing.
- First sentence: describe what the company is (size, industry, location).
- Then describe their browsing behavior and what it signals about intent.
- End with a purchase-readiness assessment based on the signals.
- Do NOT use bullet points, headers, or markdown. Write plain prose paragraphs.
- Do NOT fabricate information. Only reference data you are given.
- Keep it under 150 words.
- Do NOT include greetings, preamble, or sign-offs. Jump straight into the summary.`;

function buildUserPrompt(ctx: AccountIntelligenceContext): string {
  const lines = [
    `Generate an account intelligence summary for this company:`,
    ``,
    `Company: ${ctx.companyName}`,
    `Domain: ${ctx.domain}`,
    ctx.industry ? `Industry: ${ctx.industry}` : null,
    ctx.employeeCount ? `Employees: ~${ctx.employeeCount}` : null,
    ctx.revenueRange ? `Revenue: ${ctx.revenueRange}` : null,
    ctx.hqCity ? `HQ: ${ctx.hqCity}${ctx.hqCountry ? `, ${ctx.hqCountry}` : ""}` : null,
    ctx.techStack?.length ? `Tech Stack: ${ctx.techStack.join(", ")}` : null,
    ``,
    `--- Browsing Behavior on Our Site ---`,
    `Total Sessions: ${ctx.totalSessions}`,
    `Pages Visited: ${ctx.pagesVisited.length > 0 ? ctx.pagesVisited.join(", ") : "unknown"}`,
    `High-Intent Page Views (pricing, case studies): ${ctx.highIntentPages}`,
    ctx.latestScore != null ? `Latest Intent Score: ${ctx.latestScore}/100` : null,
    ctx.buyerStage ? `Buyer Stage: ${ctx.buyerStage}` : null,
    `Repeat Visitor: ${ctx.repeatVisitor ? "Yes" : "No"}`,
    ctx.totalTimeSeconds != null ? `Total Time on Site: ${Math.round(ctx.totalTimeSeconds / 60)} minutes` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return lines;
}

export async function generateAccountSummary(
  ctx: AccountIntelligenceContext
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    console.warn("[account-intelligence] OPENROUTER_API_KEY not configured");
    return null;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://traceable.app",
        "X-Title": "Traceable Account Intelligence",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(ctx) },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[account-intelligence] HTTP ${res.status}:`, errText.slice(0, 200));
      return null;
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";
    return content.trim() || null;
  } catch (err) {
    console.warn("[account-intelligence] fetch error:", err);
    return null;
  }
}
