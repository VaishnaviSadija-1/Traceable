# Pre-Mortem Analysis: Traceable
**Date:** 2026-03-13
**Product:** Traceable — B2B Website Visitor Intelligence System
**Launch Horizon:** MVP in 4–6 weeks

---

## Scenario

It is 6 weeks from today. Traceable has launched. The sales team is not acting on alerts. Pipeline has not grown. Two reps have already muted the Slack channel. Leadership is questioning whether to continue. What went wrong?

---

## Tigers — Real Risks That Could Derail the Launch

### 🐯 T1: Most Visitors Are Working From Home — IP Resolution Fails at Scale
**Category:** Launch-Blocking

Post-COVID, a large share of B2B buyers work from home or use mobile hotspots. IPinfo IP-to-Company resolution only works reliably for corporate office networks. If 60–70% of our visitors are on residential IPs, we may only identify 15–25% of actual B2B visitors — not the 60% assumed in the PRD.

The sales team receives 3 alerts a week instead of 30. They conclude the system doesn't work and stop checking it.

**Why this is a real risk:** The PRD's 60% resolution target is an assumption, not a tested figure. The actual resolution rate depends entirely on what percentage of our visitors use corporate networks — which we have never measured.

---

### 🐯 T2: Sales Team Has Not Defined the ICP Before Development Starts
**Category:** Launch-Blocking

The lead score formula requires a Fit Score. The Fit Score requires ICP criteria (target company size, industry, geography). The PRD lists these as TBD and explicitly flags this as a High-risk assumption.

If the sales team doesn't define ICP criteria before the scoring engine is built, we launch with placeholder weights. Every company scores equally on Fit. The lead score becomes meaningless. High-intent visits from companies we'd never sell to flood the queue at the same priority as ideal prospects.

**Why this is a real risk:** Sales teams are busy. Getting them to sit down and define ICP in writing before launch requires a deadline and a forcing function. Without it, this gets deferred until after launch, and by then the system has burned trust.

---

### 🐯 T3: GDPR/CCPA Legal Review Not Completed Before Launch
**Category:** Launch-Blocking

The PRD assumes IP-based company identification does not require user consent. This is true in many jurisdictions — but not all. Under GDPR (EU), processing any data linked to an identifiable person — including a business IP that could be traced to an individual — may require a Legitimate Interest Assessment (LIA) or explicit consent.

If legal flags this after launch and EU tracking must be paused, we lose visibility into a potentially significant portion of our traffic with no plan.

**Why this is a real risk:** The PRD acknowledges this risk but lists it as "Medium" and defers legal review to before launch. There is no owner, no date, and no fallback plan. Without a concrete action, this will be skipped.

---

### 🐯 T4: Contact Enrichment Data Is Stale, Wrong, or Missing
**Category:** Launch-Blocking

The MVP now includes contact enrichment (CEO, CTO, VP Sales) via Apollo.io or Clearbit. But enrichment database coverage is inconsistent, especially for:
- Companies under 100 employees (common in B2B SaaS)
- Non-US companies
- Companies where the "VP of Sales" title doesn't match the database's schema (e.g., "Head of Revenue," "Commercial Director")

If enrichment data is missing or wrong, the personalized email draft says "Hi [VP Sales First Name]" with a blank. The rep gets a half-complete lead card. Trust in the system erodes immediately.

**Why this is a real risk:** We have not tested Apollo/Clearbit coverage against a sample of our actual web traffic. This should be done before building the email generation feature.

---

### 🐯 T5: The Personalized Email Draft Is Generic Without Tech Stack Data
**Category:** Fast-Follow

The MVP excludes tech stack detection. But the email draft template references the company's CRM and tools as the core personalization hook ("I see you're using HubSpot…"). Without that data, the draft falls back to generic copy.

Generic outreach performs worse than no outreach. If reps see the draft and think it's embarrassing, they won't use the email feature — and may lose trust in the quality of the entire alert.

**Why this is a real risk:** The value of the email draft feature is entirely dependent on personalization depth. Without tech stack, the draft is a template any rep could write themselves.

---

### 🐯 T6: API Costs Are Not Budgeted and Could Scale Unpredictably
**Category:** Fast-Follow

The pipeline makes multiple API calls per session:
- IPinfo: per-call or subscription pricing
- Apollo.io or Clearbit: per-enrichment credit
- Factors.ai: per-user per-month

If site traffic is high, enrichment credits could be consumed rapidly — especially if we enrich every identified company on every visit rather than caching results. A company visiting daily for a week could consume 7 enrichment credits for the same firmographic data.

No budget has been defined in the PRD. No caching strategy is specified.

**Why this is a real risk:** API cost overruns are a classic MVP blind spot. They often surface in week 2, after the excitement of launch.

---

### 🐯 T7: Factors.ai Free Tier Cap Is Hit Silently
**Category:** Track

Factors.ai's free tier caps at 5,000 users/month. If traffic exceeds this, tracking may stop silently depending on the tool's behavior — no error, no alert, just missing data.

The sales team notices the alerts stopped. Engineering spends two days debugging before realizing it's a billing issue.

**Why this is a real risk:** Tier limit behavior is often undocumented or non-obvious. We should confirm what happens when the cap is hit before launch.

---

## Paper Tigers — Concerns That Sound Real But Aren't

### 📄 PT1: Competitors Already Do This Better
This is internal tooling built to give our own sales team an edge. We are not entering a competitive product market. The fact that tools like Factors.ai, 6sense, or Clearbit exist does not invalidate this — we are composing them, not competing with them.

**Why it's overblown:** This concern conflates "better tools exist in the market" with "we shouldn't build this." The goal is not to build the best visitor intelligence product — it is to get our sales team actionable leads faster than they have today. The bar is their current state (zero visibility), not 6sense Enterprise.

---

### 📄 PT2: The Scoring Weights Are Wrong on Day 1
The intent weight table (pricing = 10, blog = 2, etc.) is a starting hypothesis, not a calibrated model. The team may worry that launching with unvalidated weights will send the wrong leads to sales.

**Why it's overblown:** Scoring weights don't need to be perfect at launch — they need to be directionally correct. A rep who gets an alert about a company that spent 8 minutes on the pricing page will agree that's interesting, even if the score is 73 instead of 81. Calibration happens post-launch with real data. Waiting to get it "right" delays the learning.

---

### 📄 PT3: Sales Team Won't Use Slack
Concern that delivering alerts via Slack won't get seen.

**Why it's overblown:** Slack is the de facto communication tool for modern B2B sales teams. This risk applies to edge cases (reps on phone-heavy roles, older enterprise environments) but is not a plausible failure mode for a typical startup or SMB sales org. Email alerts are also included in MVP as a backup channel.

---

### 📄 PT4: The System Will Be Gamed By Competitors Visiting the Site
Concern that competitors or job seekers visiting the site will consume enrichment credits and generate noise.

**Why it's overblown:** The filtering layer (exclude ISPs, hosting, bots) removes most noise. Competitor visits are a very small fraction of B2B traffic. And even if a competitor shows up as a "lead," the rep will recognize the company name and dismiss it in 5 seconds. This is not a launch-blocking problem.

---

## Elephants — Unspoken Risks Nobody Is Talking About

### 🐘 E1: We Have Never Measured WFH Rate Among Our Actual Visitors
The PRD targets 60% IP resolution but has no data on what percentage of our current visitors use corporate vs. residential IPs. This number could be 20%, making the entire system much less valuable than projected.

**Nobody is asking:** "What does our actual traffic look like, and how much of it is resolvable?"

**Recommended investigation:** Pull a sample of 1,000 recent visitor IPs and run them through IPinfo before building. Measure the actual resolution rate. If it's below 40%, the product strategy may need to shift toward form-capture or session identification via other means (e.g., email link tracking, chat widget).

---

### 🐘 E2: Sales Team Adoption Has No Owner and No Plan
The PRD defines the sales team as the primary user and sets KR6 (20% of alerts acted on within 90 days). But there is no onboarding plan, no champion, and no success metric review process defined.

Who is responsible for making sure the sales team actually uses this? Who trains them? Who monitors whether alerts are being acted on?

**Nobody is asking:** "Who owns adoption, and what happens if it's low at week 4?"

**Recommended investigation:** Identify one sales champion before launch who will commit to acting on every High/Hot alert for the first 30 days and report back on quality. Without a champion, the system will be ignored during the critical first weeks when trust is being formed.

---

### 🐘 E3: Multi-Office Companies Will Appear As Multiple Leads
A large company with offices in New York, London, and Singapore may have different IP ranges for each location. Each location visit could appear as a separate "company" in the system, or worse, as different companies sharing the same domain, resulting in duplicate alerts and inflated visit counts.

**Nobody is asking:** "How do we deduplicate by company domain, not just by IP?"

**Recommended investigation:** Define deduplication logic at the company domain level (not just IP level) before building the deduplication feature. The current spec says "one alert per company per 24 hours" but the de-dupe key is unspecified.

---

### 🐘 E4: What Happens When the Enrichment API Is Down or Rate-Limited?
The MVP pipeline is synchronous: visit → IP resolve → enrich → score → alert. If Apollo or Clearbit is down or rate-limits a burst of traffic, the pipeline stalls. Alerts are delayed or never sent. The sales team notices nothing is coming in.

**Nobody is asking:** "What is the fallback when enrichment fails?"

**Recommended investigation:** Define a graceful degradation path. If enrichment fails, send the alert anyway with available data (company name, domain, pages visited, intent score) and mark contact fields as "enrichment pending." This keeps the core value flowing even when enrichment is unavailable.

---

### 🐘 E5: The Auto-Generated Email Will Be Sent Without Proofreading
The system generates a personalized email draft and delivers it in the Slack alert. The spec does not define a review step. A rep in a hurry could copy-paste the draft and send it as-is — including any placeholder text, incorrect names, or awkward phrasing generated from sparse data.

**Nobody is asking:** "What does a bad auto-generated email look like, and what happens when a rep sends one?"

**Recommended investigation:** Add a clear label to every generated draft: "DRAFT — Review before sending." Include a note listing which fields were populated vs. missing. This protects the rep and the brand reputation.

---

## Action Plans for Launch-Blocking Tigers

### Action Plan: T1 — IP Resolution Rate
| | |
|---|---|
| **Risk** | IP-to-company resolution rate may be far below the 60% assumption due to WFH/residential IPs |
| **Mitigation** | Before writing a single line of code, pull 500–1,000 recent visitor IPs from server logs and run them through IPinfo. Measure the actual resolution rate. If below 40%, revisit the product approach (e.g., prioritize form-capture enrichment or IP + email co-identification). |
| **Owner** | Engineering Lead |
| **Due Date** | Before sprint 1 begins — within 1 week of today |

---

### Action Plan: T2 — ICP Definition
| | |
|---|---|
| **Risk** | Lead scoring is meaningless without ICP fit criteria defined by the sales team |
| **Mitigation** | Schedule a 45-minute ICP definition session with the Sales Lead before development begins. Output: a written document with at minimum — target company sizes, target industries, and target geographies. These become the Fit Score rules in the scoring engine. No dev starts on scoring until this document exists. |
| **Owner** | Product Owner (facilitate) + Sales Lead (define) |
| **Due Date** | Within 1 week of today |

---

### Action Plan: T3 — GDPR/Compliance Review
| | |
|---|---|
| **Risk** | IP-based tracking of EU visitors may require a Legitimate Interest Assessment or consent mechanism under GDPR |
| **Mitigation** | Engage legal (internal or external counsel) this week for a written opinion on: (1) whether IP-to-company resolution triggers GDPR for EU visitors, and (2) what, if any, disclosure is required in the privacy policy. If legal opinion is not available before launch, geo-filter EU traffic from the alert pipeline until cleared. Do not launch EU tracking without sign-off. |
| **Owner** | Product Owner (initiate) + Legal counsel (deliver) |
| **Due Date** | Written legal opinion required before launch date |

---

### Action Plan: T4 — Enrichment Data Quality
| | |
|---|---|
| **Risk** | Contact enrichment data from Apollo/Clearbit may be missing or wrong for a large portion of identified companies, breaking the lead card and email draft |
| **Mitigation** | Before building the email generation feature, run a test enrichment batch: take 50 company domains from our existing CRM or past lead list and query Apollo/Clearbit for VP Sales contact data. Measure: (1) coverage rate — what % return a result, and (2) accuracy rate — spot check 10 names manually on LinkedIn. If coverage is below 50%, either choose a different enrichment provider or redesign the email draft to work gracefully with partial data. |
| **Owner** | Engineering Lead |
| **Due Date** | Before building Feature 3 (company enrichment) — within 2 weeks of today |

---

## Summary Table

| ID | Risk | Type | Category | Owner | Due |
|----|------|------|----------|-------|-----|
| T1 | IP resolution rate below 40% due to WFH traffic | Tiger | Launch-Blocking | Engineering Lead | Week 1 |
| T2 | ICP not defined before scoring engine is built | Tiger | Launch-Blocking | Product + Sales Lead | Week 1 |
| T3 | GDPR legal review not completed | Tiger | Launch-Blocking | Product + Legal | Before launch |
| T4 | Enrichment contact data quality untested | Tiger | Launch-Blocking | Engineering Lead | Week 2 |
| T5 | Email drafts are generic without tech stack data | Tiger | Fast-Follow | Product Owner | Post-MVP sprint |
| T6 | API costs unbudgeted, no caching strategy | Tiger | Fast-Follow | Engineering Lead | Week 2 |
| T7 | Factors.ai free tier hit silently | Tiger | Track | Engineering Lead | Pre-launch checklist |
| PT1 | Competitors do this better | Paper Tiger | — | — | No action |
| PT2 | Scoring weights are wrong on day 1 | Paper Tiger | — | — | No action |
| PT3 | Sales team won't use Slack | Paper Tiger | — | — | No action |
| PT4 | Competitors gaming the system | Paper Tiger | — | — | No action |
| E1 | Actual WFH rate among our visitors is unknown | Elephant | Investigate | Engineering Lead | Week 1 |
| E2 | No sales adoption owner or onboarding plan | Elephant | Investigate | Product + Sales Lead | Before launch |
| E3 | Multi-office deduplication not designed | Elephant | Investigate | Engineering Lead | Week 2 |
| E4 | No enrichment API fallback defined | Elephant | Investigate | Engineering Lead | Week 2 |
| E5 | Reps may send unreviewed email drafts | Elephant | Investigate | Product Owner | Before feature ships |

---

## Recommended Actions Before Sprint 1 Starts

1. **Run an IP resolution test** on 500 real visitor IPs. Know your coverage before betting the MVP on it.
2. **Get ICP criteria in writing** from the sales lead. No scoring engine without it.
3. **Start the legal conversation** about GDPR this week. Don't let it surface at launch.
4. **Run an enrichment coverage test** on 50 company domains. Know the data quality before building the email draft.
5. **Assign a sales champion** who will commit to using Traceable for the first 30 days and give feedback.

---

*Analysis by: Claude Code | Date: 2026-03-13 | Based on PRD v2.0*
