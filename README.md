# Traceable — B2B Website Visitor Intelligence Platform

> **Turn anonymous website visitors into qualified sales opportunities — in real-time.**

97% of B2B website visitors leave without ever filling out a form. Traceable solves this by identifying who visits your site, enriching their company profiles, scoring their purchase intent, and delivering actionable alerts to your sales team — all within seconds.

---

## Table of Contents

- [System Architecture Flowchart](#system-architecture-flowchart)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [How It Works — The Pipeline](#how-it-works--the-pipeline)
- [Admin Dashboard](#admin-dashboard)
- [Scoring & Intelligence Engine](#scoring--intelligence-engine)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## System Architecture Flowchart

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          TRACEABLE — SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐
  │  WEBSITE VISITOR  │
  │  (Anonymous)      │
  └────────┬─────────┘
           │  Lands on site
           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: CAPTURE                                                               │
│                                                                                 │
│  ┌───────────────────┐    ┌───────────────────┐    ┌─────────────────────────┐  │
│  │  RB2B Pixel        │    │  Session Start     │    │  Server-Side IP         │  │
│  │  (Browser Cookie)  │    │  (Page Tracking)   │    │  Extraction             │  │
│  │                    │    │                    │    │  CF → XFF → X-Real-IP   │  │
│  └────────┬───────────┘    └────────┬───────────┘    └──────────┬──────────────┘  │
│           │                         │                           │                │
└───────────┼─────────────────────────┼───────────────────────────┼────────────────┘
            │                         │                           │
            ▼                         ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: IDENTIFY                                                              │
│                                                                                 │
│  ┌─────────────────────────┐         ┌──────────────────────────────────┐       │
│  │  RB2B Webhook           │         │  IPinfo API                      │       │
│  │  ┌───────────────────┐  │         │  ┌────────────────────────────┐  │       │
│  │  │ ✓ Full Name       │  │         │  │ ✓ Company / Organization  │  │       │
│  │  │ ✓ Work Email      │  │         │  │ ✓ Domain                  │  │       │
│  │  │ ✓ LinkedIn URL    │  │         │  │ ✓ ASN / Network Type      │  │       │
│  │  │ ✓ Job Title       │  │         │  │ ✓ Location (City/Country) │  │       │
│  │  └───────────────────┘  │         │  └────────────────────────────┘  │       │
│  │  Confidence: HIGH       │         │  Confidence: MEDIUM              │       │
│  │  (US visitors, cookies) │         │  (Corporate IPs globally)        │       │
│  └─────────────────────────┘         └──────────────────────────────────┘       │
│                                                                                 │
│  Fallback Chain:  RB2B Person → IPinfo Company → Anonymous Session              │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: ENRICH                                                                │
│                                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │  Apollo API           │  │  Wappalyzer API      │  │  AI Summary           │  │
│  │  ┌────────────────┐   │  │  ┌────────────────┐  │  │  (OpenRouter /        │  │
│  │  │ Industry       │   │  │  │ CRM Tools      │  │  │   Perplexity)         │  │
│  │  │ Employee Count │   │  │  │ Marketing      │  │  │  ┌─────────────────┐  │  │
│  │  │ Revenue Range  │   │  │  │ Analytics      │  │  │  │ Account Intel   │  │  │
│  │  │ Headquarters   │   │  │  │ Website Stack  │  │  │  │ Business Signals│  │  │
│  │  │ Founded Year   │   │  │  │ Ad Platforms   │  │  │  │ Key Contacts    │  │  │
│  │  │ Description    │   │  │  │ Chat/Support   │  │  │  │ Recommendations │  │  │
│  │  │ Key Contacts   │   │  │  └────────────────┘  │  │  └─────────────────┘  │  │
│  │  └────────────────┘   │  └──────────────────────┘  └───────────────────────┘  │
│  └──────────────────────┘                                                       │
│                                                                                 │
│  All enrichment results are cached per company domain to minimize API calls      │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: SCORE                                                                 │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │  INTENT SCORE     │  │  FIT SCORE        │  │  LEAD SCORE                  │   │
│  │  (Behavior-based) │  │  (ICP-based)      │  │  (Composite)                 │   │
│  │                   │  │                   │  │                              │   │
│  │  Page Weights:    │  │  Company Size  ✓  │  │  Formula:                    │   │
│  │  Pricing    = 10  │  │  Industry      ✓  │  │  Fit × 0.4 + Intent × 0.6   │   │
│  │  Demo       =  9  │  │  Geography     ✓  │  │                              │   │
│  │  Case Study =  7  │  │  Tech Stack    ✓  │  │  Threshold: ≥ 50 → Alert     │   │
│  │  Features   =  6  │  │                   │  │                              │   │
│  │  Integrations = 5 │  │  Score: 0-100     │  │  Score: 0-100                │   │
│  │  About      =  3  │  └──────────────────┘  └──────────────────────────────┘   │
│  │  Blog       =  2  │                                                          │
│  │  Home       =  1  │  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │                   │  │  BUYER STAGE      │  │  PERSONA INFERENCE           │   │
│  │  + Time on Page   │  │                   │  │                              │   │
│  │  + Repeat Visit   │  │  Awareness   →    │  │  Inferred job title/role     │   │
│  │    Multiplier     │  │  Consideration →  │  │  from browsing behavior      │   │
│  │  (1.0x to 1.6x)  │  │  Decision    →    │  │  + confidence score          │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────────┘   │
│                                                                                 │
│  Intent Tiers:  Low (0-25) │ Medium (26-50) │ High (51-75) │ Hot (76-100)       │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 5: ALERT & ACT                                                           │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Deduplication: 1 alert per company per 24 hours                          │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │  Slack Alert          │  │  Email Alert          │  │  Daily Digest         │  │
│  │  ┌────────────────┐   │  │  ┌────────────────┐   │  │  ┌─────────────────┐ │  │
│  │  │ Company Info   │   │  │  │ Full Report    │   │  │  │ All High-Intent │ │  │
│  │  │ Intent Score   │   │  │  │ Contacts       │   │  │  │ Visitors / Day  │ │  │
│  │  │ Pages Visited  │   │  │  │ Recommended    │   │  │  │ Per-Company     │ │  │
│  │  │ Contacts       │   │  │  │ Actions        │   │  │  │ Scoring Summary │ │  │
│  │  │ Actions        │   │  │  │ Tech Stack     │   │  │  │ Recommended     │ │  │
│  │  └────────────────┘   │  │  └────────────────┘   │  │  │ Actions         │ │  │
│  └──────────────────────┘  └──────────────────────┘  │  └─────────────────┘ │  │
│                                                       └───────────────────────┘  │
│  Recommended Sales Actions (Context-Aware):                                     │
│  • "Research VP Sales on LinkedIn"                                              │
│  • "Add to outbound campaign"                                                   │
│  • "Send personalized email with tech stack context"                            │
│  • "Schedule demo — buyer is in Decision stage"                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
  ┌──────────────────┐
  │  SALES TEAM      │
  │  Acts on signal  │
  │  within minutes  │
  └──────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│  DATA FLOW SUMMARY                                                              │
│                                                                                 │
│  Visitor → Capture → Identify → Enrich → Score → Alert → Sales Action           │
│              ↓          ↓          ↓        ↓       ↓                           │
│           sessions   identities  companies scores  alerts    ← Supabase DB      │
│                                                    emails                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Real-Time Session Tracking
- Captures every page visit with timestamps and duration
- Tracks multi-page journeys as structured JSONB arrays
- Detects repeat visitors (1st, 2nd, 3rd+ visits with multiplied scoring)
- Server-side IP extraction with trusted proxy chain validation

### 2. Two-Layer Visitor Identification
| Layer | Provider | Identifies | Coverage | Confidence |
|-------|----------|-----------|----------|------------|
| **Person-Level** | RB2B | Full name, work email, LinkedIn, job title | US visitors (cookie-based) | High |
| **Company-Level** | IPinfo | Organization, domain, ASN, location | Global (corporate IPs) | Medium |

The fallback chain ensures maximum coverage: RB2B Person → IPinfo Company → Anonymous Session. This dual approach solves the "work-from-home" problem where traditional IP-only tools fail.

### 3. Company Enrichment Pipeline
- **Apollo API**: Industry, employee count, revenue range, headquarters, founding year, description, key contacts (CEO, CTO, VP Sales with LinkedIn URLs)
- **Wappalyzer**: Technology stack detection — CRM, marketing automation, analytics, website platform, ad platforms, chat/support tools
- **AI-Powered Summaries**: Account intelligence generated via OpenRouter/Perplexity including business signals (hiring, funding, expansion, product launches, partnerships)
- **Smart Caching**: All enrichment results cached per company domain to minimize API calls and cost

### 4. Intelligent Lead Scoring
- **Intent Score** (0-100): Weighted by pages visited, time on page, and repeat visit multipliers
- **Fit Score** (0-100): Based on ICP criteria — company size, industry, geography, tech stack
- **Lead Score** (0-100): Composite formula = Fit × 0.4 + Intent × 0.6
- **Buyer Stage Detection**: Awareness → Consideration → Decision (inferred from page categories)
- **Persona Inference**: Predicts likely job title/role from browsing patterns with confidence score

### 5. Instant Multi-Channel Alerts
- **Slack**: Rich card notifications with company info, scores, pages visited, contacts, and recommended actions
- **Email**: Formatted reports with full enrichment data
- **Daily Digest**: Aggregated summary of all high-intent visitors per day
- **Smart Deduplication**: One alert per company per 24-hour window to prevent noise

### 6. Context-Aware Sales Recommendations
Every alert includes AI-generated recommended actions tailored to the buyer stage, persona, and company profile — from "Research VP Sales on LinkedIn" to "Schedule demo — buyer is in Decision stage."

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, TypeScript) |
| **Frontend** | React 19, Tailwind CSS 4 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Custom HMAC-SHA256 session tokens, HTTP-only cookies |
| **Identity** | RB2B (person-level), IPinfo (company-level) |
| **Enrichment** | Apollo (firmographics + contacts), Wappalyzer (tech stack) |
| **AI** | OpenRouter / Perplexity (account intelligence & domain resolution) |
| **Alerts** | Slack Incoming Webhooks, SendGrid / Nodemailer |
| **Deployment** | Vercel (serverless) |

---

## How It Works — The Pipeline

### Step 1: Capture
When a visitor lands on the website, three things happen simultaneously:
- The **RB2B pixel** attempts person-level identification via browser cookies
- A **session** is created in the database tracking the landing URL
- The **server extracts the real IP address** from trusted proxy headers (Cloudflare → X-Forwarded-For → X-Real-IP → socket)

### Step 2: Identify
Two identification providers run in parallel:
- **RB2B** fires a webhook with person details (name, email, LinkedIn) — works for US visitors via a cookie co-op network
- **IPinfo** resolves the IP to a company/organization — works globally for corporate network IPs

Results are stored in the `identities` table with confidence levels (high/medium/low).

### Step 3: Enrich
Once a company is identified, the enrichment pipeline fires:
- **Apollo** provides firmographics (industry, size, revenue, HQ, founding year) and key contacts
- **Wappalyzer** detects the company's technology stack
- **AI Summary** generates account intelligence including business signals (hiring, funding, expansion)

All results are cached to avoid redundant API calls for returning visitors from the same company.

### Step 4: Score
The scoring engine calculates four dimensions:
- **Intent Score**: Page weights × time on page × repeat visit multiplier
- **Fit Score**: How well the company matches your ICP criteria
- **Lead Score**: Weighted composite of intent (60%) and fit (40%)
- **Buyer Stage**: Inferred from which page categories were visited

### Step 5: Alert & Act
If the lead score meets the threshold (default ≥ 50):
- A **Slack notification** is sent with a rich card containing company info, scores, contacts, and recommended actions
- An **email alert** is delivered with the full enrichment report
- **Deduplication** ensures only one alert per company per 24 hours
- A **daily digest** email aggregates all high-intent activity

---

## Admin Dashboard

The admin dashboard is a protected area (`/dashboard`) requiring authentication. It provides complete visibility into every aspect of the visitor intelligence pipeline.

### Dashboard Overview (`/dashboard`)
The main overview shows real-time KPI metric cards:
- **Active Sessions** — currently tracked visitors
- **Visitors Today** — total unique visitors for the day
- **Companies Identified** — organizations resolved via RB2B/IPinfo
- **Alerts Sent Today** — notifications delivered to sales team
- **Emails Sent Today** — outbound email count

Below the metrics is a **Recent High-Intent Sessions** table showing the latest hot leads, plus an **IP Lookup Test** tool for debugging identity resolution.

### Companies (`/dashboard/companies`)
A paginated, searchable, filterable table of all identified companies with columns:
- Company name & domain
- Industry classification
- Employee count
- AI-generated summary
- Identity confidence level
- Last seen timestamp

Clicking a company opens a **detailed profile page** (`/dashboard/companies/[id]`) featuring:
- **Header**: Full firmographics — employees, revenue, HQ, location, founding year, enrichment date
- **Tech Stack**: Visual tags showing detected technologies
- **Business Signals**: Hiring activity, funding rounds, expansion plans, product launches, partnerships (with dates and sources)
- **Contacts Table**: Key people — name, title, email, LinkedIn URL
- **Sessions History**: Every visit from this company with page journeys
- **Score History**: Intent, fit, and lead score progression over time

### Sessions (`/dashboard/sessions`)
Complete session log with columns: Company, Visitor ID, Landing Page, Page Count, Intent Score, Lead Score, Buyer Stage, Persona, Persona Confidence, and Timestamp.

The **session detail page** (`/dashboard/sessions/[id]`) displays:
- Visitor ID, IP address, referrer, creation date, and location
- Identity match (RB2B or IPinfo) with confidence level
- Linked company profile
- **Page Journey Visualization**: Every page visited with time spent
- **Events Timeline**: Chronological page_view and page_leave events
- Full score breakdown

### Alerts (`/dashboard/alerts`)
Tracks every alert dispatched to the sales team:
- Company name, intent score, lead score
- Delivery status: `sent` / `pending` / `failed`
- Slack delivery confirmation
- Email delivery confirmation
- Timestamp and date range filters

### Company Research Tool (`/dashboard/research`)
An on-demand enrichment tool — enter up to 5 company names and get instant:
- Full firmographic profiles
- Tech stack detection
- Business signals
- Key contacts
- AI-generated account intelligence summary
- Direct link to the company's dashboard page

### Emails Log (`/dashboard/emails`)
Complete audit trail for all outbound emails:
- Stats: Total Sent, Sent Today, Alert Emails, Digests
- Filter by type: `alert`, `daily_digest`, `account_intelligence`, `test`
- Table: Type, Subject, Recipient, Company, Status, Sent timestamp
- Manual triggers: **Send Test Email** and **Trigger Daily Digest** buttons

### Authentication
- Single admin account with username/password login
- HMAC-SHA256 signed session tokens stored in HTTP-only cookies
- 24-hour token expiration with middleware verification on every request

---

## Scoring & Intelligence Engine

### Intent Score (Behavior-Based)

| Page Category | Weight | Reasoning |
|--------------|--------|-----------|
| Pricing | 10 | Strongest purchase signal |
| Demo / Contact | 9 | Direct sales engagement |
| Case Studies | 7 | Evaluating social proof |
| Features | 6 | Assessing product capabilities |
| Integrations | 5 | Technical evaluation |
| About | 3 | Company research |
| Blog | 2 | Top-of-funnel awareness |
| Home | 1 | General browsing |

**Modifiers:**
- **Time on Page**: Capped at 5 minutes per page (prevents idle-tab inflation)
- **Repeat Visit Multiplier**: 1.0× (1st visit) → 1.2× (2nd) → 1.4× (3rd) → 1.6× (4th+)

### Intent Tiers

| Tier | Score Range | Meaning |
|------|------------|---------|
| Low | 0 – 25 | Casual browsing |
| Medium | 26 – 50 | Emerging interest |
| High | 51 – 75 | Active evaluation |
| Hot | 76 – 100 | Ready to buy |

### Buyer Stage Detection

| Stage | Triggered By |
|-------|-------------|
| **Awareness** | Blog, About, Home pages |
| **Consideration** | Features, Integrations, Case Studies |
| **Decision** | Pricing, Demo, Contact pages |

---

## API Endpoints

### Public Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/sessions/start` | Create session, extract IP, trigger identification |
| `POST` | `/api/v1/sessions/events` | Record page_view / page_leave events |
| `POST` | `/api/v1/integrations/rb2b/webhook` | Receive RB2B person identification |

### Internal Endpoints (Authenticated)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/internal/identity/resolve` | IPinfo IP-to-company lookup |
| `POST` | `/api/v1/internal/companies/enrich` | Apollo company enrichment |
| `POST` | `/api/v1/internal/companies/technographics` | Wappalyzer tech stack detection |
| `POST` | `/api/v1/internal/companies/summary` | AI account intelligence summary |
| `POST` | `/api/v1/internal/companies/research` | On-demand company research |
| `POST` | `/api/v1/internal/contacts/enrich` | Apollo person enrichment |
| `POST` | `/api/v1/internal/sessions/score` | Calculate intent/fit/lead scores |
| `POST` | `/api/v1/internal/alerts/evaluate` | Evaluate alert threshold + dedup |
| `POST` | `/api/v1/internal/alerts/send` | Send Slack + email alerts |
| `POST` | `/api/v1/internal/alerts/daily-digest` | Generate daily digest email |
| `POST` | `/api/v1/internal/emails/test` | Send test email |
| `POST` | `/api/v1/internal/seed` | Seed test data |
| `POST` | `/api/v1/internal/test/ip-lookup` | Test IP lookup |

### Auth Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Admin login → session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |

---

## Database Schema

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  sessions    │──FK──▶│  companies   │◀──FK──│  identities │
│              │       │              │       │             │
│ id           │       │ id           │       │ id          │
│ visitor_id   │       │ name         │       │ session_id  │
│ ip_address   │       │ domain       │       │ company_id  │
│ user_agent   │       │ industry     │       │ source      │
│ landing_url  │       │ employee_cnt │       │ (rb2b/      │
│ pages (JSON) │       │ revenue      │       │  ipinfo)    │
│ company_id   │       │ headquarters │       │ confidence  │
│ created_at   │       │ tech_stack   │       │ person_name │
└──────┬──────┘       │ signals      │       │ person_email│
       │              │ contacts     │       │ linkedin_url│
       │              │ ai_summary   │       └─────────────┘
       ▼              └──────────────┘
┌──────────────┐                            ┌─────────────┐
│session_events│       ┌──────────────┐     │   emails    │
│              │       │   scores     │     │             │
│ id           │       │              │     │ id          │
│ session_id   │       │ id           │     │ type        │
│ event_type   │       │ session_id   │     │ subject     │
│ page_url     │       │ intent_score │     │ recipient   │
│ duration     │       │ fit_score    │     │ company     │
│ metadata     │       │ lead_score   │     │ status      │
│ timestamp    │       │ buyer_stage  │     │ sent_at     │
└──────────────┘       │ persona      │     └─────────────┘
                       │ actions      │
                       └──────────────┘     ┌─────────────┐
                                            │   alerts    │
                                            │             │
                                            │ id          │
                                            │ session_id  │
                                            │ company_id  │
                                            │ intent_score│
                                            │ lead_score  │
                                            │ status      │
                                            │ slack_sent  │
                                            │ email_sent  │
                                            │ created_at  │
                                            └─────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/traceable.git
cd traceable

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys (see Environment Variables section)

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the marketing site.
Navigate to [http://localhost:3000/login](http://localhost:3000/login) to access the admin dashboard.

---

## Environment Variables

| Variable | Description |
|----------|------------|
| `NEXT_PUBLIC_APP_URL` | Application base URL |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SESSION_SECRET` | HMAC secret for signing session tokens |
| `ADMIN_USERNAME` | Admin dashboard login username |
| `ADMIN_PASSWORD` | Admin dashboard login password |
| `OPENROUTER_API_KEY` | OpenRouter API key (Perplexity for AI summaries) |
| `IPINFO_TOKEN` | IPinfo API token |
| `APOLLO_API_KEY` | Apollo.io API key |
| `WAPPALYZER_API_KEY` | Wappalyzer API key |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

---

## Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Home — hero, features grid, "How It Works", integrations |
| `/pricing` | Public | Pricing plans |
| `/case-studies` | Public | 6 customer success stories with metrics |
| `/sales-agent` | Public | AI sales agent feature page |
| `/login` | Public | Admin authentication |
| `/dashboard` | Protected | Overview metrics + recent high-intent sessions |
| `/dashboard/companies` | Protected | All identified companies (paginated, filterable) |
| `/dashboard/companies/[id]` | Protected | Company deep-dive (firmographics, tech, contacts, sessions) |
| `/dashboard/sessions` | Protected | All visitor sessions (paginated, filterable) |
| `/dashboard/sessions/[id]` | Protected | Session detail (page journey, events, scores) |
| `/dashboard/alerts` | Protected | Alert delivery log (status, channels) |
| `/dashboard/research` | Protected | On-demand company research tool |
| `/dashboard/emails` | Protected | Email audit log + manual triggers |

---

## Assignment Alignment

This project demonstrates a production-grade B2B SaaS platform implementing:

- **Full-Stack Development**: Next.js 16 with TypeScript, React 19, Tailwind CSS 4, Supabase PostgreSQL
- **Real-Time Data Pipeline**: 5-stage capture → identify → enrich → score → alert pipeline
- **Third-Party API Integration**: RB2B, IPinfo, Apollo, Wappalyzer, Slack, SendGrid, OpenRouter
- **Authentication & Authorization**: Custom HMAC-SHA256 session management with HTTP-only cookies and middleware guards
- **Database Design**: Normalized relational schema with 7 interconnected tables
- **Admin Dashboard**: 8 protected pages with real-time metrics, paginated tables, filters, search, detail views, and management tools
- **AI/ML Features**: Intent scoring, buyer stage detection, persona inference, AI-generated account intelligence
- **DevOps Ready**: Serverless deployment on Vercel, cron jobs for daily digests, environment-based configuration

---

<p align="center"><em>Built with precision. Designed for sales teams who refuse to let prospects slip away.</em></p>
