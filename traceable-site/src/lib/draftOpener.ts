/**
 * draftOpener.ts
 *
 * Generates a 1-sentence personalized sales opener for Slack/email alerts.
 * Guaranteed to never include blank placeholders like [blank] or {{field}}.
 */

import type { PageVisit } from '@/types';

interface DraftOpenerParams {
  contactName?: string;
  contactTitle?: string;
  companyName?: string;
  pagesVisited: PageVisit[];
  intentScore: number;
}

// ---------------------------------------------------------------------------
// Page-specific copy snippets (never include placeholder brackets)
// ---------------------------------------------------------------------------

const PAGE_COPY: Record<string, string> = {
  pricing: 'checking out our pricing',
  'sales-agent': 'exploring our AI sales agent',
  'case-studies': 'reading our customer case studies',
};

/**
 * Picks the most intent-signal-rich page from the visited list.
 * Preference order: pricing → sales-agent → case-studies → other.
 */
function pickHighestIntentPage(pages: PageVisit[]): string | null {
  const priority: Array<PageVisit['page_category']> = [
    'pricing',
    'sales-agent',
    'case-studies',
  ];

  for (const cat of priority) {
    if (pages.some((p) => p.page_category === cat)) {
      return PAGE_COPY[cat] ?? null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generates a natural, 1-sentence opener for sales outreach.
 *
 * Rules:
 * - Never include `[blank]`, `{{placeholder}}`, or similar patterns.
 * - Falls back gracefully when data is missing.
 * - References a specific page only if one was actually visited.
 */
export function generateDraftOpener(params: DraftOpenerParams): string {
  const { contactName, contactTitle, companyName, pagesVisited, intentScore } = params;

  // Build greeting — use name if available, otherwise generic
  const greeting = contactName ? `Hi ${contactName}` : 'Hi there';

  // Pick the most relevant page snippet
  const pageSnippet = pickHighestIntentPage(pagesVisited);

  // Build company reference only if name is known
  const companyRef = companyName ? ` at ${companyName}` : '';

  // Build title reference — only if title is present
  const titleRef = contactTitle ? `, as ${contactTitle}` : '';

  // Assemble opener based on what data we actually have
  if (pageSnippet) {
    if (intentScore >= 70) {
      // High intent — direct, specific opener
      return `${greeting}, I noticed you were ${pageSnippet}${companyRef}${titleRef} — happy to answer any questions or walk you through what makes the most sense for your team.`;
    }
    // Medium intent — softer opener
    return `${greeting}, saw you were ${pageSnippet}${companyRef} and wanted to reach out in case you had any questions.`;
  }

  // No specific page to reference — keep it brief and non-presumptuous
  if (companyName) {
    return `${greeting}, I noticed ${companyName} has been exploring our platform and wanted to check if there's anything I can help with.`;
  }

  return `${greeting}, I noticed some recent interest in our platform and wanted to reach out in case you had any questions.`;
}
