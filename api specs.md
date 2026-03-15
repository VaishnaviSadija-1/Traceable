# Traceable API Specs

**Last researched:** March 14, 2026  
**Purpose:** List the external APIs and internal backend endpoints Traceable will use.

## 1. External APIs

### 1.1 Factors.ai

**Use in Traceable**

- browser-side behavior tracking
- page views
- session timelines
- optional account journey retrieval

**Integration shape**

- install the Factors SDK in the website `<head>`
- let Factors track behavior directly from the browser
- optionally pull account journey data later through Factors API

**Relevant documented endpoint**

- `GET https://api.factors.ai/open/v1/account/account_domain/journey`

**Notes**

- Factors docs say the SDK must be placed in the `<head>` of every page to be tracked.
- Factors is primarily the tracking layer, not our IP-to-company source in this design.

### 1.2 RB2B

**Use in Traceable**

- person-level identification for eligible visitors
- optional company-only visitor sync
- repeat-visitor sync via webhook settings

**Integration shape**

- RB2B pixel runs on the website
- RB2B sends identified visitors to our backend via webhook

**Important product reality**

- standard RB2B accounts do not expose a normal public API for direct integration
- RB2B webhook integration is available for Pro users
- RB2B API access exists separately through the API Partner Program and is not included with standard accounts

**Webhook behavior we rely on**

- configure RB2B to call our public webhook URL
- optional settings include company-only profiles and repeat visitor data

**No standard public REST endpoint for MVP**

- for standard RB2B usage in this project, treat RB2B as `pixel + webhook`, not `our backend calls RB2B REST on every page view`

### 1.3 IPinfo

**Use in Traceable**

- company resolution from backend-captured visitor IP

**Documented access patterns**

- `GET https://ipinfo.io/{ip}/json?token=$TOKEN`
- modern auth styles also include Bearer token and Basic Auth on IPinfo APIs

**What we expect from the company product**

- company name
- domain
- ASN
- country
- company type / business classification

**When we call it**

- after backend receives a valid public client IP
- only from server-side workers or API routes

**Do not do**

- do not call IPinfo from the browser
- do not trust client-side self-reported IP

### 1.4 Apollo

Apollo is the primary enrichment provider in this design because its docs clearly expose the company and people endpoints we need.

#### Organization Enrichment

- `GET https://api.apollo.io/api/v1/organizations/enrich`

**Use**

- enrich one company by domain or known organization data

**Why we use it**

- primary company-firmographic lookup once `company_domain` is known

#### Bulk Organization Enrichment

- `POST https://api.apollo.io/api/v1/organizations/bulk_enrich`

**Use**

- batch enrichment for backfills or queued retries

#### Organization Search

- `POST https://api.apollo.io/api/v1/mixed_companies/search`

**Use**

- fallback when direct organization enrichment is incomplete or ambiguous

#### People API Search

- `POST https://api.apollo.io/api/v1/mixed_people/api_search`

**Use**

- search for likely VP Sales, CEO, CTO, or marketing leaders by title and company filters

**Important note**

- Apollo docs say this endpoint is optimized for API usage and does not consume credits, but it also does not return email addresses or phone numbers directly

#### People Enrichment

- `POST https://api.apollo.io/api/v1/people/match`

**Use**

- enrich a selected person after People Search identifies a likely match

#### Bulk People Enrichment

- `POST https://api.apollo.io/api/v1/people/bulk_match`

**Use**

- batch enrichment of shortlisted contacts

**Authentication**

- Apollo docs show API-key based auth in headers
- some reference pages also show Bearer credential support in the interactive docs
- in implementation we should standardize on the auth method supported by the specific purchased plan

### 1.5 Wappalyzer

**Use in Traceable**

- primary tech stack lookup by company website

**Endpoint**

- `GET https://api.wappalyzer.com/v2/lookup/`

**Key query parameters**

- `urls`
- `sets`
- `live`
- `recursive`
- `callback_url`

**Recommended use in Traceable**

- first attempt: cached lookup with normal request
- if not found and we need live crawl: use callback-capable flow

**Good fit for this project because**

- can return technologies plus optional company/contact data sets
- has documented callback behavior for async deep scans

### 1.6 BuiltWith

**Use in Traceable**

- fallback tech stack lookup if Wappalyzer is not selected or produces weak results

**Domain API**

- `GET https://api.builtwith.com/v22/api.json?KEY=...&LOOKUP=example.com`

**Use**

- retrieve current and historical technology information for a domain

### 1.7 Slack Incoming Webhooks

**Use in Traceable**

- primary alert delivery channel

**Webhook URL shape**

- `POST https://hooks.slack.com/services/...`

**Payload**

- JSON body with `text`
- can also include Block Kit `blocks`

**Use in Traceable**

- send lead-card style alert to the sales channel

### 1.8 SendGrid

**Use in Traceable**

- fallback alert delivery
- optional dual-channel delivery

**Endpoint**

- `POST https://api.sendgrid.com/v3/mail/send`

**Auth**

- `Authorization: Bearer <API_KEY>`

**Use in Traceable**

- send alert email when Slack fails or email delivery is explicitly enabled

## 2. External Call Order

### 2.1 At session start

1. Factors SDK runs in browser
2. RB2B pixel runs in browser
3. backend captures IP from request metadata
4. backend calls IPinfo

### 2.2 After identity is known

1. if RB2B webhook arrives, merge person identity into the session
2. if IPinfo resolves a business company, create company record
3. check cache for company enrichment
4. call Apollo Organization Enrichment if cache is stale or missing
5. call Apollo People Search for target contacts
6. call Apollo People Enrichment only for selected people if needed
7. call Wappalyzer for tech stack
8. if Wappalyzer is unavailable or commercially not chosen, call BuiltWith

### 2.3 At alert time

1. send Slack webhook
2. if Slack fails, use SendGrid

## 3. Proposed Internal Backend Endpoints

These are our backend endpoints, not vendor endpoints.

### 3.1 Session ingestion

#### `POST /api/v1/sessions/start`

Creates a backend session as soon as a website visit begins.

**Input**

- anonymous client/session token
- landing URL
- referrer
- user agent

**Backend action**

- extract IP from request headers / socket
- create session row
- enqueue identity resolution

#### `POST /api/v1/sessions/events`

Accepts page and behavior events from the site.

**Input**

- session id
- page URL
- page title
- event timestamp
- time-on-page or engagement metadata

### 3.2 RB2B ingestion

#### `POST /api/v1/integrations/rb2b/webhook`

Public webhook endpoint for RB2B.

**Purpose**

- receive person-level or company-level visitor match payloads
- connect RB2B match to active session or company record

**Security**

- use secret token in query params if RB2B requires self-contained webhook auth
- optionally validate source IP if RB2B documents a stable source range later

### 3.3 Identity resolution

#### `POST /api/v1/internal/identity/resolve`

Internal worker-triggered endpoint or queue consumer.

**Purpose**

- call IPinfo with the stored IP
- normalize RB2B + IPinfo identity
- write canonical identity result

### 3.4 Enrichment

#### `POST /api/v1/internal/companies/enrich`

**Purpose**

- fetch or refresh Apollo company data
- fetch target contacts
- persist normalized firmographic fields

#### `POST /api/v1/internal/companies/technographics`

**Purpose**

- call Wappalyzer first
- call BuiltWith if needed
- store stack categories for the company

### 3.5 Scoring

#### `POST /api/v1/internal/sessions/score`

**Purpose**

- compute intent score
- assign buyer stage
- compute fit score and lead score
- attach recommended actions

### 3.6 Alerting

#### `POST /api/v1/internal/alerts/evaluate`

**Purpose**

- apply threshold and dedupe rules
- decide whether to alert

#### `POST /api/v1/internal/alerts/send`

**Purpose**

- send Slack alert
- if needed send SendGrid alert
- store delivery outcome

## 4. Minimal Request/Response Contracts

### `POST /api/v1/sessions/start`

**Request**

```json
{
  "anonymous_id": "anon_123",
  "landing_url": "https://example.com/pricing",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0"
}
```

**Response**

```json
{
  "session_id": "sess_123",
  "status": "accepted"
}
```

### `POST /api/v1/integrations/rb2b/webhook`

**Request**

```json
{
  "external_profile_id": "rb2b_123",
  "email": "person@company.com",
  "full_name": "Jane Doe",
  "linkedin_url": "https://linkedin.com/in/janedoe",
  "company_name": "Acme",
  "company_domain": "acme.com",
  "event_type": "new_match"
}
```

**Response**

```json
{
  "status": "ok"
}
```

### `POST /api/v1/internal/alerts/send`

**Request**

```json
{
  "session_id": "sess_123",
  "company_domain": "acme.com",
  "lead_score": 78,
  "buyer_stage": "Decision",
  "channels": ["slack", "email"]
}
```

**Response**

```json
{
  "status": "sent",
  "channels": {
    "slack": "ok",
    "email": "queued"
  }
}
```

## 5. Provider Selection Decisions

### Recommended primary stack

- Tracking: Factors.ai
- Person identification: RB2B webhook flow
- Company identification: IPinfo
- Enrichment: Apollo
- Technographics: Wappalyzer
- Alerting: Slack
- Delivery fallback: SendGrid

### Recommended fallback behavior

- No RB2B match: rely on IPinfo
- No IPinfo business match: keep tracked-only session
- No Apollo company/contact data: send partial alert if score is strong
- No Wappalyzer result: try BuiltWith
- No Slack delivery: send SendGrid

## 6. Sources

- Factors SDK install: [help.factors.ai/en/articles/9000478-manually-place-factors-sdk](https://help.factors.ai/en/articles/9000478-manually-place-factors-sdk)
- Factors Account Journey API: [help.factors.ai/en/articles/11028633-account-journey-api](https://help.factors.ai/en/articles/11028633-account-journey-api)
- RB2B webhook setup: [support.rb2b.com/en/articles/8976614-setup-guide-webhook](https://support.rb2b.com/en/articles/8976614-setup-guide-webhook)
- RB2B API availability note: [support.rb2b.com/en/articles/9268264-do-you-have-an-api-that-we-can-use](https://support.rb2b.com/en/articles/9268264-do-you-have-an-api-that-we-can-use)
- RB2B API Partner Program: [support.rb2b.com/en/articles/12579420-rb2b-s-api-partner-program](https://support.rb2b.com/en/articles/12579420-rb2b-s-api-partner-program)
- IPinfo developer docs: [ipinfo.io/developers](https://ipinfo.io/developers/)
- IPinfo IP to Company product: [ipinfo.io/products/ip-company-api](https://ipinfo.io/products/ip-company-api)
- Apollo Organization Enrichment: [docs.apollo.io/reference/organization-enrichment](https://docs.apollo.io/reference/organization-enrichment)
- Apollo Organization Search: [docs.apollo.io/reference/organization-search](https://docs.apollo.io/reference/organization-search)
- Apollo People API Search: [docs.apollo.io/reference/people-api-search](https://docs.apollo.io/reference/people-api-search)
- Apollo People Enrichment: [docs.apollo.io/reference/people-enrichment](https://docs.apollo.io/reference/people-enrichment)
- Apollo API pricing and credit notes: [docs.apollo.io/docs/api-pricing](https://docs.apollo.io/docs/api-pricing)
- Wappalyzer API overview: [wappalyzer.com/api](https://www.wappalyzer.com/api/)
- Wappalyzer lookup endpoint: [wappalyzer.com/docs/api/v2/lookup](https://www.wappalyzer.com/docs/api/v2/lookup/)
- BuiltWith Domain API: [api.builtwith.com](https://api.builtwith.com/)
- Slack incoming webhooks: [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)
- SendGrid Mail Send API: [twilio.com/docs/sendgrid/api-reference/mail-send/mail-send](https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send)
