-- =============================================================================
-- Traceable — Supabase PostgreSQL Schema
-- Phase 1: Session Tracking + Phase 2: Identity Resolution
--
-- Run this script against your Supabase project via:
--   Dashboard → SQL Editor → paste & run
--   OR: psql $DATABASE_URL -f supabase-schema.sql
--
-- All internal tables deny access to the anon role (RLS enforced).
-- The service-role key bypasses RLS and is the only way to write/read.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- sessions
-- Core session record created on first page load.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id    TEXT,                          -- client-generated anonymous ID
  ip            INET,                          -- server-extracted IP (never client)
  user_agent    TEXT,
  referrer      TEXT,
  landing_url   TEXT        NOT NULL,
  pages         JSONB       NOT NULL DEFAULT '[]'::jsonb,  -- PageVisit[]
  identity_id   UUID,                          -- FK → identities.id (set after RB2B match)
  company_id    UUID,                          -- FK → companies.id (set after IPInfo resolve)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sessions IS 'One record per visitor session. IP is always server-extracted.';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id   ON sessions (visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ip           ON sessions (ip);
CREATE INDEX IF NOT EXISTS idx_sessions_company_id   ON sessions (company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at   ON sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at   ON sessions (updated_at DESC);

-- ---------------------------------------------------------------------------
-- session_events
-- Granular events (page_view, click, scroll, form_submit, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_events (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID        REFERENCES sessions (id) ON DELETE CASCADE,  -- NULL for Umami aggregate rows
  event_type     TEXT        NOT NULL,         -- 'page_view' | 'umami_page_view' | 'click' | 'scroll' | etc.
  page_url       TEXT        NOT NULL,
  page_category  TEXT        NOT NULL DEFAULT 'other'
                               CHECK (page_category IN ('pricing', 'sales-agent', 'case-studies', 'other')),
  metadata          JSONB,                        -- arbitrary event payload; Umami rows include { visits, window_days, avg_visit_duration_seconds }
  duration_seconds  INTEGER    DEFAULT NULL,      -- time spent on page (set by page_leave events)
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE session_events IS 'Granular events within a session.';

CREATE INDEX IF NOT EXISTS idx_session_events_session_id  ON session_events (session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_timestamp   ON session_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_session_events_event_type  ON session_events (event_type);
CREATE INDEX IF NOT EXISTS idx_session_events_page_cat    ON session_events (page_category);

-- ---------------------------------------------------------------------------
-- identities
-- Person-level identity data resolved via RB2B webhook or manual linkage.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS identities (
  id                   UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id           UUID  REFERENCES sessions (id) ON DELETE SET NULL,
  source               TEXT  NOT NULL CHECK (source IN ('rb2b', 'ipinfo', 'manual')),
  email                TEXT,
  full_name            TEXT,
  first_name           TEXT,
  last_name            TEXT,
  linkedin_url         TEXT,
  title                TEXT,
  company_name         TEXT,
  company_domain       TEXT,
  company_linkedin_url TEXT,
  location             TEXT,
  country              TEXT,
  rb2b_raw             JSONB,   -- full RB2B person payload for debugging
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate identity records per session + source
  UNIQUE (session_id, source)
);

COMMENT ON TABLE identities IS 'Deanonymised person records from RB2B or other identity providers.';

CREATE INDEX IF NOT EXISTS idx_identities_session_id     ON identities (session_id);
CREATE INDEX IF NOT EXISTS idx_identities_company_domain ON identities (company_domain);
CREATE INDEX IF NOT EXISTS idx_identities_email          ON identities (email);
CREATE INDEX IF NOT EXISTS idx_identities_created_at     ON identities (created_at DESC);

-- ---------------------------------------------------------------------------
-- companies
-- Deduplicated company records from IPInfo lookups and enrichment.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id              UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain          TEXT  UNIQUE,          -- canonical company domain
  name            TEXT,
  country         TEXT,
  city            TEXT,
  region          TEXT,
  org             TEXT,                  -- raw IPInfo org string
  industry        TEXT,                  -- from Apollo enrichment
  employee_count  INTEGER,
  revenue_range   TEXT,
  hq_city         TEXT,
  hq_country      TEXT,
  tech_stack      JSONB  DEFAULT '[]'::jsonb,
  contacts        JSONB  DEFAULT '[]'::jsonb,
  confidence      TEXT   NOT NULL DEFAULT 'low'
                           CHECK (confidence IN ('high', 'medium', 'low')),
  ipinfo_raw      JSONB,                 -- raw IPInfo payload
  apollo_raw      JSONB,                 -- raw Apollo enrichment payload
  enriched_at     TIMESTAMPTZ,
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE companies IS 'Deduplicated B2B company records derived from IP resolution and enrichment.';

CREATE INDEX IF NOT EXISTS idx_companies_domain      ON companies (domain);
CREATE INDEX IF NOT EXISTS idx_companies_name        ON companies (name);
CREATE INDEX IF NOT EXISTS idx_companies_created_at  ON companies (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_last_seen   ON companies (last_seen_at DESC);

-- ---------------------------------------------------------------------------
-- scores
-- Intent / lead scores computed for a session + company pair.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scores (
  id                      UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id              UUID  NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  company_id              UUID  REFERENCES companies (id) ON DELETE SET NULL,
  score                   INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  fit_score               INTEGER NOT NULL DEFAULT 0 CHECK (fit_score BETWEEN 0 AND 100),
  lead_score              INTEGER NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  buyer_stage             TEXT  NOT NULL DEFAULT 'unknown'
                            CHECK (buyer_stage IN ('awareness', 'consideration', 'decision', 'unknown')),
  pages_visited           JSONB  DEFAULT '[]'::jsonb,   -- PageCategory[]
  repeat_visit            BOOLEAN NOT NULL DEFAULT FALSE,
  high_intent_pages       INTEGER NOT NULL DEFAULT 0,
  session_duration_secs   INTEGER,
  computed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE scores IS 'Intent and ICP fit scores per session, recomputed on each enrichment cycle.';

CREATE INDEX IF NOT EXISTS idx_scores_session_id   ON scores (session_id);
CREATE INDEX IF NOT EXISTS idx_scores_company_id   ON scores (company_id);
CREATE INDEX IF NOT EXISTS idx_scores_score        ON scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at   ON scores (created_at DESC);

-- ---------------------------------------------------------------------------
-- alerts
-- Sales alerts sent to Slack / email when a high-intent visitor is identified.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id          UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID  NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  company_id  UUID  REFERENCES companies (id) ON DELETE SET NULL,
  score       INTEGER NOT NULL DEFAULT 0,
  lead_score  INTEGER,
  status      TEXT  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'suppressed', 'failed')),
  slack_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB,   -- extra context (snapshot of company/person data at alert time)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE alerts IS 'Sales alert records — one row per alert event, tracking delivery status.';

CREATE INDEX IF NOT EXISTS idx_alerts_session_id  ON alerts (session_id);
CREATE INDEX IF NOT EXISTS idx_alerts_company_id  ON alerts (company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status      ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at  ON alerts (created_at DESC);

-- ---------------------------------------------------------------------------
-- Foreign key back-references (added after both tables exist)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sessions_identity_id'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT fk_sessions_identity_id
      FOREIGN KEY (identity_id) REFERENCES identities (id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sessions_company_id'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT fk_sessions_company_id
      FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- All internal tables: anon role has zero access.
-- Service role bypasses RLS automatically.
-- ---------------------------------------------------------------------------
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE identities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;

-- Deny all access for the anon / authenticated roles on internal tables.
-- Only the service_role (used by supabaseAdmin) can read/write.
-- If you need read access from authenticated users in the future,
-- add a specific SELECT policy here.

CREATE POLICY "deny_anon_sessions"
  ON sessions FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_session_events"
  ON session_events FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_identities"
  ON identities FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_companies"
  ON companies FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_scores"
  ON scores FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "deny_anon_alerts"
  ON alerts FOR ALL TO anon USING (false) WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- updated_at auto-update trigger (optional quality-of-life helper)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_identities_updated_at
  BEFORE UPDATE ON identities
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE OR REPLACE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
