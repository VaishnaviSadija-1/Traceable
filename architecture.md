# Traceable Architecture

**Primary input:** [PRD-Traceable.md](/Users/vaishnavisadija/projects/Traceable/PRD-Traceable.md)  
**API reference:** [api specs.md](/Users/vaishnavisadija/projects/Traceable/api specs.md)

## 1. What This System Actually Does

Traceable watches a website session, collects behavior data, tries to identify the visitor or company, enriches the company, scores the session, and sends a sales alert if the lead is strong enough.

The architecture has five runtime stages:

1. Capture the visit
2. Resolve identity
3. Enrich the account
4. Score and deduplicate
5. Send alerts

## 2. Tooling Structure

| Stage | Primary Tool | Fallback / Secondary | Why |
|---|---|---|---|
| Website behavior tracking | Factors.ai SDK | Internal backend session event ingestion | Factors gives ready-made session/page tracking |
| Person-level identification | RB2B pixel + RB2B webhook | None for standard RB2B accounts | RB2B is the only person-level source in the PRD |
| Company-level identification | IPinfo IP-to-Company | No fallback in MVP | IPinfo is the company-resolution source in the PRD |
| Company enrichment | Apollo Organization Enrichment | Apollo Organization Search + Apollo People Search | Apollo can provide both company and contact data |
| Contact enrichment | Apollo People Search + People Enrichment | Partial alert if no contact found | We still want alerts even when contact coverage is weak |
| Tech stack detection | Wappalyzer lookup | BuiltWith Domain API | Wappalyzer has a clear modern API; BuiltWith remains optional fallback |
| Alert delivery | Slack Incoming Webhook | SendGrid email | Slack is the primary sales channel in the PRD |
| Storage | Supabase Postgres | None in MVP | System of record for session, company, score, alert |

## 3. Exact Runtime Flow

### Step 1: Visitor enters the website

When a user lands on the website, three things happen in parallel:

- Factors.ai SDK starts tracking page views and session behavior in the browser
- RB2B pixel runs in the browser for identity matching
- our backend captures the request metadata and extracts the visitor IP server-side

### Step 2: Where the IP comes from

The IP must be captured on the backend, not trusted from frontend JavaScript.

Preferred source order:

1. edge / CDN forwarded client IP header, if the site is behind a trusted proxy
2. `X-Forwarded-For`, using the first public IP after proxy validation
3. direct socket IP from the request

This IP is attached to the session envelope stored in our backend.

### Step 3: First-party session is created

Our backend creates a session record with:

- session id
- first seen timestamp
- landing URL
- referrer
- client IP
- user agent
- current page events as they arrive

This happens before any external enrichment call so we never lose the visit.

### Step 4: RB2B identification path

RB2B is not a normal public REST dependency for standard accounts. The practical integration path is:

1. RB2B pixel runs on site
2. RB2B identifies a visitor if it has a match
3. RB2B sends the identified record to our public webhook endpoint
4. our backend links that RB2B payload to the active session

If RB2B returns person-level data, this becomes the primary identity for the session.

### Step 5: IPinfo company-resolution path

As soon as the backend has a valid public IP, it calls IPinfo from the server.

Decision:

- if IPinfo returns a business/company match, create or update the company identity
- if IPinfo returns ISP, hosting, residential, or no match, do not use it for alerting

This path is the fallback when RB2B does not identify the visitor.

### Step 6: Identity merge

Identity precedence:

1. RB2B person-level match
2. IPinfo company-level match
3. anonymous tracked session only

Merge rules:

- if RB2B and IPinfo both agree on the company, mark confidence high
- if RB2B identifies a person and IPinfo has no match, keep RB2B as source of truth
- if IPinfo identifies a company and RB2B has no match, proceed with company-only enrichment
- if both disagree, prefer RB2B for person identity but log the mismatch

### Step 7: Enrichment

Once we have `company_domain`, enrichment starts.

Primary enrichment order:

1. check local cache in Supabase for company data
2. if stale or missing, call Apollo Organization Enrichment
3. if enrichment is incomplete, call Apollo Organization Search as a fallback lookup
4. use Apollo People Search to find likely CEO / CTO / VP Sales
5. use Apollo People Enrichment only when we need to firm up a specific selected person

Important design rule:

- enrichment is keyed by `company_domain`, not by session
- repeat visits should reuse cached company intelligence

### Step 8: Tech stack lookup

This is a company-level stage, not a session-level stage.

Primary path:

- call Wappalyzer lookup using the company website URL

Fallback:

- if Wappalyzer has no useful result or is not selected commercially, call BuiltWith Domain API

Because tech stack is slower-moving data, this should be cached longer than enrichment.

### Step 9: Scoring

When behavior plus identity data is ready, the scoring engine computes:

- intent score from pages visited and time on page
- buyer stage from page categories
- fit score from ICP rules
- lead score from intent + fit

### Step 10: Deduplication and repeat visits

Before alerting, the system checks:

- has this company already been alerted in the last 24 hours?
- is this a repeat visit that should raise urgency but not create duplicate spam?

Deduplication key priority:

1. normalized `company_domain`
2. normalized `company_name + country`

### Step 11: Alerting

If `lead_score >= threshold`:

1. send Slack alert through Incoming Webhook
2. if Slack fails or email is enabled, send email via SendGrid
3. store delivery result in Supabase

If enrichment is incomplete:

- still send a partial alert if identity + behavior are strong enough
- mark missing fields as unavailable or pending

## 4. Primary and Fallback Decision Table

| Need | Primary | Fallback | If both fail |
|---|---|---|---|
| Person identity | RB2B | None in MVP | keep session anonymous |
| Company identity | IPinfo | RB2B company from matched profile | keep session tracked-only |
| Company profile | Apollo Organization Enrichment | Apollo Organization Search | partial alert or no alert depending on score |
| Leadership contacts | Apollo People Search | Apollo People Enrichment on selected candidates | send alert without named contacts |
| Tech stack | Wappalyzer | BuiltWith | send alert without stack data |
| Slack delivery | Slack webhook | SendGrid email | store failed alert for retry |

## 5. Core Internal Services

We should keep the backend split into these logical services:

- `collector`
  Receives browser events and creates session records

- `identity-resolver`
  Calls IPinfo and receives RB2B webhook data

- `enrichment-worker`
  Calls Apollo and tech-stack providers with caching

- `scoring-worker`
  Computes intent, fit, buyer stage, and lead score

- `alert-worker`
  Applies dedupe rules and sends Slack/email alerts

- `persistence`
  Stores sessions, companies, enrichment, scores, and alert history in Supabase

## 6. Minimal Data Stored Per Stage

### Session stage

- session id
- timestamps
- IP
- user agent
- pages visited

### Identity stage

- RB2B person payload if present
- IPinfo company payload if present
- merged identity source and confidence

### Company stage

- company domain
- industry
- employee count
- description
- contacts
- tech stack

### Decision stage

- intent score
- fit score
- lead score
- recommended actions
- alert sent flag

## 7. Failure Policy

- If Factors fails, the website still loads and no blocking behavior occurs.
- If RB2B fails, continue with IPinfo.
- If IPinfo fails, continue with RB2B if RB2B identified the visitor.
- If Apollo fails, keep the company/session and send a partial alert if the score is still strong.
- If Wappalyzer and BuiltWith fail, continue without tech stack.
- If Slack fails, attempt SendGrid and mark the Slack delivery failed.

## 8. Implementation Shape for MVP

MVP should be built as:

- website snippets: Factors + RB2B
- backend API: session collector + RB2B webhook + orchestration endpoints
- background workers: IPinfo, Apollo, Wappalyzer, scoring, alerting
- database: Supabase Postgres

That keeps the flow concrete:

- browser captures behavior
- backend captures IP
- RB2B identifies people by webhook
- IPinfo identifies companies by IP
- Apollo enriches accounts and contacts
- Wappalyzer or BuiltWith adds technographics
- scoring decides urgency
- Slack and SendGrid deliver alerts
