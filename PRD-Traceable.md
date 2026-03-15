# PRD: Traceable — B2B Website Visitor Intelligence System

**Status:** Draft
**Version:** 2.1
**Date:** 2026-03-14

---

## 1. Summary

Traceable is a B2B website visitor intelligence system that turns anonymous website traffic into actionable sales leads. It uses a two-layer identification approach: RB2B to identify individual visitors by name, work email, and LinkedIn profile (for US visitors); and IPinfo for company-level identification of corporate network visitors worldwide. Together, these cover visitors working from home, on VPNs, and on corporate office networks. It then builds a full company profile, scores purchase intent and buyer stage, and delivers recommended sales actions to the sales team in real time — all without requiring the visitor to fill out a form.

---

## 2. Contacts

| Name | Role | Notes |
|------|------|-------|
| TBD | Sales Lead / Primary Stakeholder | Primary consumer of lead alerts, profiles, and action recommendations. Defines ICP. |
| TBD | Sales Rep(s) | Receive Slack/email alerts with recommended next actions. |
| TBD | Marketing Lead | Secondary consumer. Uses data for campaign attribution and audience segmentation. |
| TBD | Engineering Lead | Owns integrations: IPinfo, enrichment API, tech stack detection, alert delivery. |
| TBD | Product Owner | Owns PRD, prioritization, and release decisions. |

> **Note:** Stakeholder names to be confirmed before project kickoff.

---

## 3. Background

### Context

Most B2B websites convert fewer than 3% of visitors into leads through forms. The remaining 97% leave without identifying themselves, even if they spent significant time on high-intent pages like pricing or product features.

Sales teams are flying blind. They know traffic numbers from Google Analytics, but they don't know *who* is visiting, *what company they work for*, *what tools that company uses*, or *when to reach out*.

### Why Now

- **RB2B** now enables person-level identification (name, work email, LinkedIn) for US website visitors — including those working from home on residential IPs — at no cost on the free tier.
- **IPinfo** covers corporate network visitors globally, complementing RB2B for non-US and office-based traffic.
- Behavior analytics tools like Factors.ai now offer intent tracking, account journey mapping, and scoring out of the box on a free or low-cost tier.
- Tech stack detection services (e.g., BuiltWith, Wappalyzer) can now identify a company's CRM, marketing automation platform, and website stack from their domain alone.
- The sales team lacks pipeline visibility and misses opportunities from untracked, high-intent web visitors.
- Composing these existing tools removes the need for expensive custom infrastructure.

### What Has Changed

Previously, the WFH problem (most B2B buyers work from home on residential IPs that IP tools cannot identify) made web visitor intelligence unreliable. RB2B solves this by using a co-op cookie network instead of IP addresses — it identifies the person in the browser regardless of what network they're on. Combined with IPinfo for corporate visitors, Traceable now covers the full spectrum of B2B web traffic.

Today, five lightweight tools can be composed to deliver the full pipeline: track behavior → identify person/company → enrich profile → detect tech stack → score intent → recommend action.

---

## 4. Objective

### Goal

Give the sales team the ability to see which companies are visiting the website, what they're looking at, how interested they appear to be, what tools they use, and exactly what to do next — so reps can reach the right person at the right time with a relevant message.

### Company Benefit

- Capture intent signals from the 97% of visitors who never fill out a form.
- Reduce time spent on manual prospecting by surfacing pre-qualified, in-market accounts automatically.
- Give reps a head start on personalization by knowing the company's tech stack before first contact.
- Deliver specific recommended actions so reps spend time doing outreach, not researching.

### SMART Key Results

| # | Key Result | Target | Timeframe |
|---|-----------|--------|-----------|
| KR1 | Successfully identify company from IP address | Identify company for ≥ 60% of non-bot, non-residential traffic | Within 30 days of launch |
| KR2 | Track pages visited + time on page for identified accounts | 100% of page views captured for all tracked sessions | Within 30 days of launch |
| KR3 | Generate intent score and buyer stage for each identified visit | Score and stage produced for every identified session | Within 30 days of launch |
| KR4 | Build full company profile including tech stack | Tech stack fields populated for ≥ 70% of identified companies | Within 45 days of launch |
| KR5 | Deliver recommended sales actions with every alert | Every alert includes at least one recommended action | Within 60 days of launch |
| KR6 | Sales team acts on at least 20% of high-intent alerts | Outreach initiated on ≥ 20% of High/Hot-stage leads per week | Within 90 days of launch |

---

## 5. Market Segment(s)

### Who We Are Building For

**Primary user: Sales Development Representatives (SDRs) and Account Executives (AEs)**

These are people who need to know when a target account is showing buying signals. They are busy, context-switch often, and need information delivered in tools they already use (Slack, email). They should not need to log into a new dashboard to get value. Recommended actions must be specific enough to act on immediately.

**Secondary user: Marketing team**

Marketing uses the data to understand which campaigns and content pieces attract the right accounts, and to refine targeting.

### Constraints

- **B2B focus only:** IP-to-company resolution works for corporate networks. Residential IPs and VPNs will not resolve. The system is scoped to B2B accounts, not consumer traffic.
- **Volume:** Factors.ai free tier supports 5,000 users/month. This is the initial ceiling.
- **Privacy/compliance:** Company-level identification does not require cookies or consent under most jurisdictions, but legal review is required before launch, especially for EU visitors.
- **Website platform:** Assumes the website can accept a JavaScript tracking snippet.

---

## 6. Value Proposition(s)

### Jobs to Be Done

| Job | Who | Current Pain |
|-----|-----|-------------|
| Know which companies are visiting right now | Sales | No visibility — just anonymous traffic numbers |
| Understand what stage the buyer is at | Sales | Reps guess based on gut feel |
| Know what tools the company already uses | Sales/Marketing | Hours of manual research per account |
| Get a specific action to take, not just data | Sales | Data without direction doesn't save time |
| Catch high-intent accounts before they go to a competitor | Sales | No early warning system exists |
| Understand which content attracts target accounts | Marketing | Attribution stops at campaign level, not account level |

### Gains Delivered

- Full company profile per identified visitor: firmographics, leadership, tech stack, founding details.
- Specific recommended sales actions for each lead — no guesswork.
- Intent score + buyer stage so reps know urgency and approach.
- Tech stack data enables highly personalized outreach ("I see you're using HubSpot…").
- Alerts in Slack or email — no new tool to learn for MVP.

### Pains Solved

- **No more blind outreach:** Rep knows company context before first touch.
- **No more manual research:** Tech stack, founders, company size, and leadership fetched automatically.
- **No more missed windows:** Alerts fire within minutes of a qualifying visit.
- **No more generic messaging:** Tech stack and intent stage enable relevant, timely outreach.

---

## 7. Solution

### 7.1 UX / User Flows

#### Flow 1: Visitor Tracking and Identification (Automated Backend)

1. A visitor lands on the website.
2. The Factors.ai JavaScript snippet captures:
   - Pages visited (URL, page title)
   - Time spent on each page
   - Session start/end timestamps
   - Number of visits (first visit vs. repeat visit)
   - Browser and device metadata
3. Two identification layers run simultaneously:

   **Layer A — RB2B (person-level, US visitors)**
   - The RB2B pixel fires and checks if the visitor's browser has a co-op cookie from RB2B's publisher network.
   - If matched: returns the visitor's full name, work email, LinkedIn profile URL, and company.
   - Coverage: ~20–35% of US visitors, regardless of IP type (home, VPN, mobile, office all work).

   **Layer B — IPinfo (company-level, all visitors)**
   - The visitor's IP address is captured server-side and sent to the IPinfo IP-to-Company API.
   - If matched: returns company name, domain, ASN, country, and company type.
   - Coverage: corporate office networks globally. Filters out residential, ISP, hosting, and bot IPs.

4. Identification result is determined by whichever layer fires:
   - RB2B match → person-level profile (highest quality)
   - IPinfo match only → company-level profile
   - Neither match → session logged in Factors.ai, no alert sent

5. For identified sessions:
   - Company firmographic data is enriched (see Feature 3).
   - Intent score and buyer stage are calculated (see Feature 5).
   - Lead score is calculated (see Feature 6).
6. If lead score meets the notification threshold, a lead profile is assembled.
7. The profile and recommended sales actions are delivered via Slack and email.

#### Flow 2: Sales Rep Receives Alert and Acts

1. A Slack message or email arrives with a structured lead card:
   - Company name, domain, country, industry, size
   - Founding year, founders, business description
   - Pages visited with time spent per page
   - Intent score, intent tier (Low/Medium/High/Hot)
   - Buyer stage (Awareness / Consideration / Decision)
   - Detected tech stack (CRM, marketing automation, website platform, analytics)
   - Key contacts: CEO, CTO, VP Sales (name + LinkedIn)
   - Lead score
   - **Recommended sales actions** (1–3 specific next steps)
2. The rep reads the card and follows the recommended actions.
3. The rep does not need to open any other tool to know what to do.

#### Flow 3: Repeat Visit Detection

1. The same company visits the website again within 7 or 30 days.
2. The system recognizes it as a repeat visit and upgrades the intent score.
3. A follow-up alert is sent noting it is a repeat visit with updated behavior data.

#### Flow 4: Marketing Reviews Account Behavior (Secondary)

1. Marketing logs into the Factors.ai dashboard.
2. They view which companies visited, which content they engaged with, and how those visits map to campaigns.
3. They filter to identify which campaigns attract target-account traffic.

---

### 7.2 Key Features

#### Feature 1: Activity Tracking

**What it does:** Captures the full behavior of every website session.

| Signal Tracked | Detail |
|---------------|--------|
| Pages visited | URL, page title, order of pages in session |
| Time per page | Seconds spent, capped at 5 min to exclude idle tabs |
| Visit timestamp | Date and time of session start |
| Session duration | Total time on site |
| Visit count | First visit or Nth repeat visit |
| Entry and exit page | Where they started and where they left |

**Powered by:** Factors.ai JavaScript snippet embedded on the website.

---

#### Feature 2: Two-Layer Visitor Identification

Identification runs two layers simultaneously on every session. Each layer catches visitors the other misses.

---

**Layer A: RB2B — Person-Level Identification**

**What it does:** Identifies the actual person visiting your website — name, work email, and LinkedIn profile — by matching the visitor's browser against RB2B's co-op cookie network of B2B publisher sites.

**How it works:** The visitor previously visited any site in RB2B's publisher network (B2B blogs, SaaS review sites, industry publications) and was cookied. When that same browser visits your site, RB2B matches the cookie to a known identity in their database.

**Why this matters for WFH:** This match is entirely cookie-based, not IP-based. It works on residential home networks, consumer VPNs, and mobile — the visitors that IPinfo cannot see.

| Data Field | Source |
|-----------|--------|
| Full name | RB2B |
| Work email address | RB2B |
| LinkedIn profile URL | RB2B |
| Company name | RB2B (derived from work email domain) |

**Coverage:** ~20–35% of US visitors. US-only — RB2B restricts to US traffic due to GDPR.
**Pricing:** Free tier (100 profiles/month). Paid tiers for higher volume.
**Limitation:** Requires the visitor to have a co-op cookie from a prior RB2B publisher visit. Does not work for non-US visitors.

---

**Layer B: IPinfo — Company-Level Identification**

**What it does:** Resolves every visitor's IP address to a company using the IPinfo IP-to-Company API. Catches corporate office visitors globally, including non-US visitors outside RB2B's scope.

| Data Field | Source |
|-----------|--------|
| Company name | IPinfo |
| Company domain | IPinfo |
| ASN | IPinfo |
| Company type | IPinfo (business / ISP / hosting / education / government) |
| Country | IPinfo |

**Filtering:** Sessions from ISPs, hosting providers, known bot networks, and residential IPs are discarded. Only `type: business` entries are processed further.
**Coverage:** Corporate office network IPs globally. Zero coverage for residential, VPN, or mobile IPs.
**Fallback:** If IPinfo cannot identify a company, the session is still tracked in Factors.ai but no alert is sent unless RB2B already matched.

---

**Combined Coverage:**

| Visitor Type | RB2B Covers? | IPinfo Covers? |
|-------------|-------------|---------------|
| US visitor, working from home | Yes (~25% match rate) | No |
| US visitor, corporate office | Yes (if co-op cookie) | Yes |
| Non-US visitor, corporate office | No | Yes |
| Non-US visitor, working from home | No | No |
| VPN user (any location) | Yes (if co-op cookie) | No |
| Mobile (any location) | Yes (if co-op cookie, US) | No |

---

#### Feature 3: Company Profile Enrichment

**What it does:** Once a company is identified, a full company profile is built using enrichment APIs (e.g., Apollo.io, Clearbit, or Crunchbase API).

**Company Firmographics:**

| Field | Description | Source |
|-------|-------------|--------|
| Company name | Full legal name | IPinfo / Enrichment |
| Website | Company domain | IPinfo |
| Industry | Sector/vertical | Enrichment API |
| Business description | What the company does (1–2 sentences) | Enrichment API |
| Company size | Employee count range | Enrichment API |
| Founding year | Year the company was founded | Enrichment API |
| Founders | Names of co-founders | Enrichment API |
| Headquarters | City, country | Enrichment API |

**Leadership Contacts:**

| Role | Fields |
|------|--------|
| CEO | Name, LinkedIn URL |
| CTO | Name, LinkedIn URL |
| VP of Sales | Name, LinkedIn URL |
| CMO / VP Marketing | Name, LinkedIn URL |
| Head of Engineering | Name, LinkedIn URL |

> These contacts are the people sales reps will reach out to. Priority: VP of Sales and CEO.

---

#### Feature 4: Tech Stack Detection

**What it does:** Identifies the tools and platforms the company uses, enabling highly relevant outreach. Detected from the company's public website using services like BuiltWith or Wappalyzer.

**Tech Stack Categories:**

| Category | What We Detect | Example Values | Why It Matters |
|---------|---------------|---------------|---------------|
| CRM | Customer relationship management tool | Salesforce, HubSpot, Pipedrive | Informs integration pitch and CRM sync |
| Marketing Automation | Email/campaign automation | Marketo, HubSpot, ActiveCampaign, Pardot | Shows marketing maturity |
| Website Platform | CMS or site builder | WordPress, Webflow, Shopify, Next.js | Relevant for implementation conversations |
| Analytics | Web analytics tool | Google Analytics, Mixpanel, Amplitude | Shows data sophistication |
| Ad Platform | Paid ads setup | Google Ads, LinkedIn Ads | Signals growth investment |
| Chat / Support | Customer-facing chat | Intercom, Drift, Zendesk | Signals go-to-market stage |

**Source:** BuiltWith API or Wappalyzer API (to be selected based on coverage and cost).

---

#### Feature 5: Intent Scoring and Buyer Stage

**Intent scoring** measures how interested the visitor appears based on what they looked at and for how long. **Buyer stage** groups visitors into three stages that map to how sales should approach them.

**Intent Weight Table:**

| Page Category | Example URLs | Intent Weight | Why |
|--------------|-------------|--------------|-----|
| Pricing | /pricing, /plans | 10 | Strongest purchase intent signal |
| Demo / Contact | /demo, /contact, /book-a-call | 9 | Direct conversion intent |
| Case Studies | /case-studies/*, /customers/* | 7 | Evaluating proof of value |
| Product / Features | /product/*, /features/* | 6 | Understanding capabilities |
| Integrations | /integrations/* | 5 | Evaluating technical fit |
| About / Team | /about, /team | 3 | General curiosity |
| Blog / Resources | /blog/*, /resources/* | 2 | Top of funnel / awareness |
| Home | / | 1 | Entry point only |
| Other | All other pages | 1 | Default low weight |

**Repeat Visit Bonus:**

| Visit Count | Score Multiplier |
|------------|-----------------|
| 1st visit | 1.0× (no bonus) |
| 2nd visit | 1.2× |
| 3rd visit | 1.4× |
| 4th+ visit | 1.6× |

Repeat visits indicate sustained interest and should be weighted more heavily.

**Intent Score Calculation:**

```
Raw Score = SUM( page_intent_weight × MIN(time_on_page_seconds / 60, 5) )

Intent Score = MIN( (Raw Score / Max Possible Score) × 100, 100 ) × Repeat Visit Multiplier
```

- `time_on_page_seconds / 60` converts to minutes, capped at 5 to prevent idle-tab inflation.
- Max Possible Score = top 3 highest-weight pages × 5 minutes each (reference session).

**Intent Tiers and Buyer Stages:**

| Score Range | Intent Label | Buyer Stage | What It Means | Sales Action |
|-------------|-------------|-------------|--------------|-------------|
| 0–25 | Low | Awareness | Browsing, no clear intent | Log only, no alert |
| 26–50 | Medium | Awareness | Exploring the product | Alert sent, low priority |
| 51–75 | High | Consideration | Evaluating seriously | Alert sent, respond within 24h |
| 76–100 | Hot | Decision | Ready to buy or talk | Alert sent, respond within 2h |

**Buyer Stage Definitions:**

- **Awareness:** Visitor is learning what the product is. Visited blog, home, or about pages.
- **Consideration:** Visitor is evaluating whether the product fits their needs. Visited features, integrations, or case study pages.
- **Decision:** Visitor is close to a purchase decision. Visited pricing, demo, or contact pages — especially on repeat visits.

---

#### Feature 6: Lead Scoring

Lead score combines how well the company fits our ideal customer profile (Fit Score) with how engaged they are (Intent Score).

**Lead Score Formula:**

```
Lead Score = (Fit Score × 0.4) + (Intent Score × 0.6)
```

- Intent is weighted higher (60%) because real-time engagement signals matter more than static firmographic fit.
- Fit Score is based on ICP criteria defined by the sales team.

**Fit Score Rules (example — to be refined by sales team):**

| Criteria | Condition | Points |
|----------|-----------|--------|
| Company size | 51–500 employees | 30 |
| Company size | 501–5,000 employees | 40 |
| Company size | 5,001+ employees | 20 |
| Industry | Target industry match | 40 |
| Industry | Adjacent industry | 20 |
| Geography | Target region | 30 |
| Geography | Other region | 10 |

**Alert Threshold:** Lead Score ≥ 50. Configurable.

---

#### Feature 7: Recommended Sales Actions

**What it does:** Every alert includes 1–3 specific, actionable next steps for the sales rep. Actions are selected based on the buyer stage and tech stack.

**Action Logic:**

| Buyer Stage | Detected Tech Stack Signal | Recommended Action |
|------------|--------------------------|-------------------|
| Awareness | Any | Add account to awareness nurture campaign |
| Consideration | CRM detected (e.g., Salesforce) | Research VP of Sales on LinkedIn; mention their current CRM in outreach |
| Consideration | No CRM detected | Send product overview + integration capabilities deck |
| Decision | Pricing page visited | Send personalized pricing email with a 1:1 demo offer |
| Decision (repeat) | Pricing page visited 2+ sessions | Immediate personalized outreach from AE; reference their repeat visits |
| Decision | Demo page visited | Book a discovery call within 2 hours |

**Standard Action Library (shown in alerts):**

1. **Research VP Sales** — LinkedIn profile linked directly in the alert for the identified VP of Sales at the company.
2. **Add account to outbound campaign** — One-click link to add the company to the relevant sequence in your outreach tool (e.g., Apollo, Outreach, HubSpot Sequences).
3. **Send personalized outreach** — Pre-filled email draft included in the alert, personalized using: company name, pages visited, buyer stage, and detected tech stack.

**Example Personalized Email Draft (auto-generated in alert):**

> Subject: [Company Name] + [Your Product]
>
> Hi [VP Sales First Name],
>
> I noticed [Company Name] was exploring our pricing page earlier today — wanted to reach out personally.
>
> Given that you're currently using [Detected CRM], I thought you'd appreciate how [Your Product] integrates directly with it, so your team doesn't have to change their workflow.
>
> Would a 15-minute call this week make sense?
>
> [Your Name]

---

#### Feature 8: Sales Alert Delivery

- **Channels:** Slack (MVP), email (V2).
- **Trigger:** Lead Score ≥ 50 (configurable).
- **Deduplication:** One alert per company per 24-hour window.
- **Alert card contents:**
  - Company name, domain, HQ, industry, size, founding year, description
  - Founders listed
  - Pages visited (URL + time per page), in order
  - Visit count (first visit or repeat visit N)
  - Intent score + intent tier + buyer stage
  - Lead score
  - Detected tech stack (CRM, marketing automation, analytics, website)
  - Key contacts: CEO, CTO, VP Sales (name + LinkedIn URL)
  - 1–3 recommended sales actions
  - Session timestamp

---

### 7.3 Technology Stack

| Component | Tool | Notes |
|-----------|------|-------|
| Behavior tracking | Factors.ai | JS snippet. Free tier: 5,000 users/month. Tracks pages, time, sessions. |
| Person-level identification (US) | RB2B | JS pixel. Free tier: 100 profiles/month. Returns name, work email, LinkedIn. Cookie-based — works on home/VPN/mobile IPs. |
| Company-level identification (global) | IPinfo IP-to-Company API | Pay-per-call or subscription. Covers corporate office IPs worldwide. Complements RB2B for non-US and office visitors. |
| Company enrichment | Apollo.io or Clearbit | Firmographics, contacts, founding data. Budget TBD. |
| Tech stack detection | BuiltWith API or Wappalyzer API | Domain-based detection of CRM, analytics, website platform. |
| Intent + lead scoring | Custom logic | Lightweight serverless function (AWS Lambda / Vercel Edge). |
| Action recommendation | Rule-based engine | Maps buyer stage + tech stack → action from action library. |
| Alert delivery | Slack Webhooks + SendGrid email | Both channels in MVP. |
| Data storage | Supabase (Postgres) | One row per session. |
| Dashboard | Factors.ai built-in | No custom dashboard needed for MVP. |

---

### 7.4 Assumptions

| # | Assumption | Risk Level | Notes |
|---|-----------|-----------|-------|
| A1 | The website can accept a third-party JavaScript snippet (Factors.ai) | Medium | Will not work on sites with strict CSP or no-JS frameworks |
| A2 | IPinfo + RB2B combined will identify ≥ 50% of meaningful B2B sessions | Medium | IPinfo covers corporate IPs; RB2B covers ~25% of US visitors via cookie match. Neither covers non-US WFH visitors. |
| A2b | RB2B free tier (100 profiles/month) is sufficient for MVP traffic | Low | Upgrade is simple if exceeded. RB2B paid tiers are affordable. |
| A2c | RB2B is compliant for US-only traffic. EU visitors will not be processed by RB2B | Low | RB2B geo-fences to US by default. Confirm this is configured correctly before launch. |
| A3 | A company enrichment API (Apollo/Clearbit) is available and budgeted | High | Without this, company profile will be incomplete |
| A4 | BuiltWith or Wappalyzer can detect tech stack from company domain | Medium | Detection rate varies; some companies use custom or obscured stacks |
| A5 | The sales team uses Slack as primary communication channel | Low | Nearly universal in modern B2B orgs |
| A6 | Monthly website traffic is under 5,000 unique visitors initially (Factors.ai free tier) | Low | Upgrade is straightforward if exceeded |
| A7 | IP-based identification does not require GDPR/CCPA consent for our target markets | Medium | Legal review required before launch, especially for EU traffic |
| A8 | Sales team will define ICP fit criteria before development begins | High | Without this, fit score cannot be configured |
| A9 | VP of Sales at identified companies can be found via enrichment API | Medium | Some companies have non-standard titles or private profiles |

---

## 7.5 Data Schema

### Session Record

| Field | Type | Source | Example |
|-------|------|--------|---------|
| `session_id` | string | Generated | `sess_a1b2c3d4` |
| `session_start` | timestamp | Factors.ai | `2026-03-13T14:22:00Z` |
| `session_end` | timestamp | Factors.ai | `2026-03-13T14:35:00Z` |
| `ip_address` | string | Server-side | `203.0.113.42` |
| `visit_count` | integer | Calculated | `2` |

### Visitor Identity (from RB2B — person-level, US only)

| Field | Type | Example |
|-------|------|---------|
| `rb2b_matched` | boolean | `true` |
| `visitor_name` | string | `John Carter` |
| `visitor_work_email` | string | `john@acme.com` |
| `visitor_linkedin_url` | string | `linkedin.com/in/johncarter` |

### Company Identity (from IPinfo — company-level, global)

| Field | Type | Example |
|-------|------|---------|
| `ipinfo_matched` | boolean | `true` |
| `company_name` | string | `Acme Corporation` |
| `company_domain` | string | `acme.com` |
| `company_type` | string | `business` |
| `asn` | string | `AS12345` |
| `country` | string | `US` |

### Company Profile (from Enrichment API)

| Field | Type | Example |
|-------|------|---------|
| `industry` | string | `SaaS / Software` |
| `business_description` | string | `Acme provides B2B contract management software.` |
| `employee_count` | integer | `320` |
| `founding_year` | integer | `2015` |
| `founders` | array of strings | `["Jane Smith", "Bob Lee"]` |
| `headquarters` | string | `San Francisco, US` |

### Leadership Contacts (from Enrichment API)

| Field | Type | Example |
|-------|------|---------|
| `ceo_name` | string | `Jane Smith` |
| `ceo_linkedin` | string | `linkedin.com/in/janesmith` |
| `cto_name` | string | `Bob Lee` |
| `cto_linkedin` | string | `linkedin.com/in/boblee` |
| `vp_sales_name` | string | `Raj Patel` |
| `vp_sales_linkedin` | string | `linkedin.com/in/rajpatel` |

### Tech Stack (from BuiltWith / Wappalyzer)

| Field | Type | Example |
|-------|------|---------|
| `crm` | string | `Salesforce` |
| `marketing_automation` | string | `HubSpot` |
| `website_platform` | string | `Webflow` |
| `analytics` | string | `Google Analytics` |
| `ad_platform` | string | `LinkedIn Ads` |
| `chat_support` | string | `Intercom` |

### Behavior (from Factors.ai)

| Field | Type | Example |
|-------|------|---------|
| `pages_visited` | array of objects | See below |
| `total_pages` | integer | `5` |
| `total_session_time_seconds` | integer | `780` |

**Pages Visited sub-object:**

| Field | Type | Example |
|-------|------|---------|
| `url` | string | `/pricing` |
| `page_title` | string | `Pricing — Traceable` |
| `time_on_page_seconds` | integer | `183` |
| `visited_at` | timestamp | `2026-03-13T14:25:00Z` |

### Scores and Actions

| Field | Type | Example |
|-------|------|---------|
| `intent_score` | float | `78.4` |
| `intent_tier` | string | `Hot` |
| `buyer_stage` | string | `Decision` |
| `fit_score` | float | `70.0` |
| `lead_score` | float | `74.6` |
| `recommended_actions` | array of strings | `["Research VP Sales", "Add to outbound campaign", "Send personalized email"]` |
| `generated_email_draft` | string | Full email text |
| `alert_sent` | boolean | `true` |
| `alert_timestamp` | timestamp | `2026-03-13T14:40:00Z` |

---

## 8. Release

### MVP (Target: 4–6 Weeks)

Core pipeline end-to-end: identify company from IP, track behavior, score intent, deliver Slack alert with recommended actions.

**MVP Scope:**

- [ ] Factors.ai snippet embedded on website, tracking page views and time on page
- [ ] RB2B pixel installed on website — person-level identification for US visitors (name, email, LinkedIn)
- [ ] IP address captured server-side and resolved via IPinfo — company-level identification for corporate office visitors
- [ ] Two-layer merge logic: if RB2B matches, use person-level data; if IPinfo matches only, use company-level data; if neither, log only
- [ ] Company filtering: exclude ISPs, hosting providers, bots from IPinfo results
- [ ] Intent score calculated using page weight table + repeat visit multiplier
- [ ] Buyer stage assigned (Awareness / Consideration / Decision)
- [ ] Lead score calculated (manual fit rules + intent score)
- [ ] Company enrichment via Apollo.io or Clearbit: industry, size, founders, founding year, business description
- [ ] Leadership contacts in alerts: CEO, CTO, VP Sales (name + LinkedIn URL)
- [ ] Auto-generated personalized email draft using company name, tech stack context, and buyer stage
- [ ] Recommended sales actions generated based on buyer stage and page signals
- [ ] Slack alert sent for Lead Score ≥ 50, containing full session data + recommended actions
- [ ] Email alert delivery (SendGrid or similar) in addition to Slack
- [ ] Deduplication: one alert per company per 24 hours
- [ ] Session storage: Supabase table or Google Sheet

**MVP Exclusions (added in V2):**

- Tech stack detection (BuiltWith / Wappalyzer)
- Automated ICP fit scoring rules (manual assignment for MVP)
- Alert performance tracking (acted-on rate)

---

### Version 2 (Target: 6–10 Weeks Post-MVP)

- Tech stack detection via BuiltWith or Wappalyzer: CRM, marketing automation, website platform, analytics
- ICP fit scoring rules automated (no more manual assignment)
- Alert performance tracking: how many alerts were acted on
- Configurable alert threshold (sales team can adjust Lead Score cutoff via settings)

---

### Version 3 / Future (Target: 3–6 Months Post-MVP)

- CRM integration: auto-create leads/accounts in Salesforce or HubSpot when alert fires
- One-click "Add to outbound sequence" from Slack alert (Apollo, Outreach, or HubSpot Sequences)
- Weekly digest report for sales leadership: top companies visited that week, stage breakdown
- Account-based retargeting: trigger LinkedIn/Google ad audiences from identified companies
- Multi-session journey tracking: see a company's full visit history across 30 days
- Predictive scoring: use historical conversion data to continuously improve score weights
- Visitor-level identification when visitor self-identifies via form or email click

---

*Document owner: TBD | Last updated: 2026-03-13 | Version: 2.0*
