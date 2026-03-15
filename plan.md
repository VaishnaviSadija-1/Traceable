# Traceable Phased Delivery Plan

## Summary

Traceable should start with a **greenfield Next.js test website** as **Phase 0**, because the product depends on real visitor journeys before the tracking and alerting pipeline can be validated. The site should mirror the requested visual direction closely: same color palette, `Instrument Sans`, soft warm background, coral primary accent, blue secondary/tertiary text, clean spacing, and a polished B2B marketing feel.

The initial site should include three rich static pages:

- `/pricing`
- `/sales-agent`
- `/case-studies`

This plan keeps the website and the visitor-intelligence system tightly connected: first create realistic traffic surfaces, then instrument them, then resolve identity, enrich, score, and alert.

## Phase Plan

### Phase 0: Test Website Foundation

**Goal:** Build the website that will generate the journeys Traceable is meant to detect.

**Work**

- Create a greenfield Next.js marketing site with:
  - `/pricing`
  - `/sales-agent`
  - `/case-studies`
- Apply the supplied visual system as the design baseline:
  - `Instrument Sans`
  - `--color-primary: #FF725C`
  - `--color-primary-dark: #DA624F`
  - `--color-secondary: #495883`
  - `--color-tertiary: #093555`
  - `--color-background: #FEFBF9`
  - `--color-link: #098486`
  - the provided root CSS variables and body typography rules
- Preserve the provided `body:has(...)` header/banner padding behavior where relevant, but adapt it to the new header structure instead of copying unused selectors blindly.
- Design a clean, rich UI with:
  - strong hero sections
  - sticky or semi-sticky top nav
  - premium card sections
  - pricing grid on `/pricing`
  - product narrative and workflow blocks on `/sales-agent`
  - customer proof/story cards on `/case-studies`
- Ensure each page has distinct content and interaction depth so later scoring can distinguish low vs high intent.
- Make the pages responsive for desktop and mobile.

**Deliverables**

- a polished test marketing website
- shared design tokens and layout primitives
- navigation between all three pages
- realistic page sections that support later visitor scoring

**Exit criteria**

- all three routes exist and feel production-grade
- the site visually matches the requested style direction
- each page has enough content depth to create meaningful intent signals

### Phase 1: Tracking and Session Foundation

**Goal:** Instrument the website so visits can be observed reliably.

**Work**

- Add Factors.ai to the site head and define the event/session capture strategy.
- Add first-party backend session intake:
  - `POST /api/v1/sessions/start`
  - `POST /api/v1/sessions/events`
- Capture server-side IP from trusted proxy headers or socket.
- Persist session records, page visits, timestamps, referrers, and user-agent data in Supabase.
- Define page categories for the new website routes so later scoring maps correctly:
  - `/pricing` = pricing intent
  - `/sales-agent` = product/features intent
  - `/case-studies` = proof/evaluation intent

**Deliverables**

- full page/session tracking on the test site
- backend session records tied to real visits
- stable route-level event data for the three pages

**Exit criteria**

- visits to the test website generate usable session records
- page timelines are available for real browsing sessions
- IP is captured server-side only

### Phase 2: Identity Resolution Backbone

**Goal:** Connect tracked visits to people or companies.

**Work**

- Add RB2B pixel to the website and ingest matches through:
  - `POST /api/v1/integrations/rb2b/webhook`
- Implement IPinfo lookup through:
  - `POST /api/v1/internal/identity/resolve`
- Merge identity using the agreed precedence:
  - RB2B person match first
  - IPinfo business company second
  - anonymous session otherwise
- Store canonical company identity and repeat-visit keys.

**Deliverables**

- RB2B matches linked to sessions
- IPinfo business companies linked to sessions
- company-level identity keys for dedupe and repeat visits

**Exit criteria**

- identified visits can be separated from anonymous visits
- mismatch handling is deterministic
- company-domain-level identity is ready for enrichment

### Phase 3: Enrichment and Technographics

**Goal:** Turn an identified company into a useful sales profile.

**Work**

- Implement company enrichment:
  - `POST /api/v1/internal/companies/enrich`
- Use Apollo in this order:
  - cache lookup
  - Organization Enrichment
  - Organization Search fallback
  - People Search for likely contacts
  - People Enrichment only for shortlisted people
- Implement technographics:
  - `POST /api/v1/internal/companies/technographics`
- Use Wappalyzer first and BuiltWith as fallback.
- Cache everything by `company_domain`, not by session.

**Deliverables**

- company firmographics
- key contacts
- technographics profile
- partial-enrichment states when data is incomplete

**Exit criteria**

- repeat visits reuse existing company intelligence
- missing contact/stack data no longer blocks the pipeline
- partial profiles are still actionable

### Phase 4: Scoring, Actions, and Alerts

**Goal:** Convert visits into sales-ready alerts.

**Work**

- Implement scoring:
  - `POST /api/v1/internal/sessions/score`
- Compute:
  - intent score
  - buyer stage
  - fit score from ICP
  - lead score
- Implement alert evaluation:
  - `POST /api/v1/internal/alerts/evaluate`
- Implement delivery:
  - `POST /api/v1/internal/alerts/send`
- Send Slack-first alerts with SendGrid fallback.
- Generate recommended actions and outreach drafts with missing-field safeguards.

**Deliverables**

- end-to-end alert flow
- deduplication and repeat-visit logic
- action recommendations
- safe draft outreach content

**Exit criteria**

- a real visit to the website can produce a complete alert
- duplicate alerts are suppressed
- partial alerts still send when enrichment is incomplete

### Phase 5: Launch Hardening

**Goal:** Make the MVP reliable enough for real use.

**Work**

- Add retries and failure-state logging for provider outages.
- Add monitoring for:
  - session count
  - identity rate
  - enrichment success
  - alert volume
  - delivery failures
- Add cost controls for Apollo and technographics usage.
- Validate end-to-end latency from visit to alert.
- Run sales UAT on alert usefulness and signal quality.
- Finalize privacy-policy updates and geo-handling if needed.

**Deliverables**

- production readiness checklist
- provider-failure visibility
- cost guardrails
- sales signoff on alert usefulness

**Exit criteria**

- provider failures do not silently drop qualified leads
- the team can observe and troubleshoot the pipeline
- launch blockers are closed

### Phase 6: Post-Launch Optimization

**Goal:** Improve quality based on real traffic.

**Work**

- tune scoring weights
- improve contact title matching
- improve multi-office dedupe
- add acted-on tracking
- expand reporting for marketing
- plan CRM sync and one-click outbound actions

**Deliverables**

- calibrated scoring
- clearer adoption metrics
- prioritized V2 backlog

## Important Interfaces

Core internal interfaces remain:

- `POST /api/v1/sessions/start`
- `POST /api/v1/sessions/events`
- `POST /api/v1/integrations/rb2b/webhook`
- `POST /api/v1/internal/identity/resolve`
- `POST /api/v1/internal/companies/enrich`
- `POST /api/v1/internal/companies/technographics`
- `POST /api/v1/internal/sessions/score`
- `POST /api/v1/internal/alerts/evaluate`
- `POST /api/v1/internal/alerts/send`

Phase 0 adds the public app routes:

- `/pricing`
- `/sales-agent`
- `/case-studies`

## Test Plan

- The three public pages render correctly on desktop and mobile.
- Shared design tokens and typography are applied consistently across all pages.
- `/pricing`, `/sales-agent`, and `/case-studies` produce distinct page-intent categories.
- Session ingestion works for page entry and navigation between the three routes.
- Server-side IP capture works without frontend IP dependence.
- RB2B matches attach to the correct session.
- IPinfo business matches create company identity; non-business matches do not.
- Apollo enrichment and Wappalyzer/BuiltWith fallback work from a company-domain key.
- Alerts trigger correctly for pricing-heavy and repeat-visit journeys.
- Slack fallback to SendGrid works.
- Missing enrichment data still allows a partial alert.
- No generated outreach includes blank placeholders.

## Assumptions and Defaults

- Phase 0 is a **real website build**, not a mock or wireframe.
- The site will be **greenfield Next.js**.
- `/ase-studies` is treated as `/case-studies`.
- The visual language should match the supplied CSS direction closely, using the same palette and font foundation.
- The first website version is **static but rich**, not form-heavy or app-like.
- The site is intentionally designed to generate strong visitor-intent signals for later pipeline testing.
