"use client";

import Link from "next/link";

/* ─── Hero mock dashboard ─────────────────────────────────────────────────── */

function DashboardMockup() {
  const sessions = [
    { company: "Acme Corp", page: "/pricing", intent: 94, time: "2s ago", badge: "hot" },
    { company: "Stripe", page: "/features", intent: 81, time: "18s ago", badge: "warm" },
    { company: "Notion", page: "/case-studies", intent: 76, time: "1m ago", badge: "warm" },
    { company: "Figma", page: "/integrations", intent: 58, time: "4m ago", badge: "cold" },
  ];

  const badgeColor: Record<string, string> = {
    hot: "#FF725C",
    warm: "#f59e0b",
    cold: "#6b7280",
  };

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        width: "100%",
        maxWidth: "620px",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          background: "var(--color-tertiary)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5F57", display: "block" }} />
        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FFBD2E", display: "block" }} />
        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28C840", display: "block" }} />
        <span style={{ marginLeft: "8px", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
          Traceable — Live Sessions
        </span>
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            color: "#28C840",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#28C840",
              display: "inline-block",
              animation: "pulse 1.5s infinite",
            }}
          />
          LIVE
        </span>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {[
          { label: "Active Visitors", value: "24" },
          { label: "Identified Today", value: "138" },
          { label: "Alerts Sent", value: "11" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: "14px 20px",
              borderRight: i < 2 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <p style={{ fontSize: "20px", fontWeight: "700", color: "var(--color-tertiary)", margin: 0 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Session rows */}
      <div>
        {sessions.map((s, i) => (
          <div
            key={s.company}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 20px",
              borderBottom: i < sessions.length - 1 ? "1px solid var(--color-border-light)" : "none",
              background: i === 0 ? "rgba(255,114,92,0.04)" : "transparent",
            }}
          >
            {/* Company avatar */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: `hsl(${i * 60 + 200}, 55%, 88%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                color: `hsl(${i * 60 + 200}, 55%, 30%)`,
                flexShrink: 0,
              }}
            >
              {s.company[0]}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--color-tertiary)",
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.company}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-muted)",
                  margin: 0,
                  fontFamily: "monospace",
                }}
              >
                {s.page}
              </p>
            </div>

            {/* Intent badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: badgeColor[s.badge],
                  background: `${badgeColor[s.badge]}18`,
                  padding: "2px 8px",
                  borderRadius: "999px",
                }}
              >
                {s.intent}
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{s.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Slack alert row */}
      <div
        style={{
          background: "#4A154B10",
          borderTop: "1px solid var(--color-border)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "16px" }}>📣</span>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
          <strong style={{ color: "var(--color-tertiary)" }}>Slack alert sent:</strong> Acme Corp just visited /pricing
          — 94 intent score. They&rsquo;re ready to talk.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

/* ─── Features grid ───────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "🎯",
    title: "Session Capture",
    description:
      "Record every page visit, scroll depth, and click path in real time. Build a complete behavioral profile before a visitor ever raises their hand.",
  },
  {
    icon: "🔍",
    title: "Identity Resolution",
    description:
      "Match anonymous IPs to real company names and individual contacts using RB2B and IPinfo — without requiring a form fill.",
  },
  {
    icon: "🏢",
    title: "Company Enrichment",
    description:
      "Automatically pull firmographics: industry, headcount, revenue, tech stack, and open job roles — straight from Apollo and Clearbit.",
  },
  {
    icon: "⚙️",
    title: "Tech Intelligence",
    description:
      "Detect which tools a prospect runs via Wappalyzer. Know before the call whether they use Salesforce, HubSpot, or a homegrown stack.",
  },
  {
    icon: "📊",
    title: "Lead Scoring",
    description:
      "A composite intent score (0–100) weighs pages visited, time spent, visit frequency, and ICP fit to surface the hottest accounts first.",
  },
  {
    icon: "⚡",
    title: "Instant Alerts",
    description:
      "Push rich Slack or email notifications the moment a high-intent visitor lands — so your SDRs can reach out while you're still top of mind.",
  },
];

/* ─── How it works steps ──────────────────────────────────────────────────── */

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Visitor lands on your site",
    description:
      "A lightweight script captures session data the moment someone hits your domain — pages viewed, time on site, referral source, and device.",
  },
  {
    step: "02",
    title: "Identity resolved in seconds",
    description:
      "We cross-reference the visitor's IP and browser fingerprint against our data partners to identify the company and, where possible, the individual contact.",
  },
  {
    step: "03",
    title: "Alert sent straight to Slack",
    description:
      "Your sales team gets a rich card: company name, intent score, pages visited, and suggested talking points — right in the Slack channel you choose.",
  },
];

/* ─── Integration logos ───────────────────────────────────────────────────── */

const INTEGRATIONS = [
  { name: "RB2B", color: "#2563EB" },
  { name: "IPinfo", color: "#0891B2" },
  { name: "Apollo", color: "#7C3AED" },
  { name: "Wappalyzer", color: "#DC2626" },
  { name: "Slack", color: "#4A154B" },
  { name: "SendGrid", color: "#1A82E2" },
];

/* ─── Trusted-by logos ────────────────────────────────────────────────────── */

const TRUSTED_LOGOS = [
  "Vercel",
  "Notion",
  "Retool",
  "Linear",
  "Loom",
  "Segment",
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: "136px",
          paddingBottom: "96px",
          background: "linear-gradient(165deg, #FEFBF9 0%, #FFF5F3 50%, #F0F4FF 100%)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "56px",
              alignItems: "center",
            }}
            className="hero-grid"
          >
            {/* Copy */}
            <div style={{ maxWidth: "560px" }}>
              <span className="section-eyebrow">Real-time Visitor Intelligence</span>
              <h1
                style={{
                  fontSize: "clamp(36px, 5.5vw, 64px)",
                  fontWeight: "800",
                  lineHeight: "1.08",
                  letterSpacing: "-0.03em",
                  color: "var(--color-tertiary)",
                  marginBottom: "24px",
                }}
              >
                Know who visits.{" "}
                <span style={{ color: "var(--color-primary)" }}>Strike while intent is hot.</span>
              </h1>
              <p
                style={{
                  fontSize: "18px",
                  lineHeight: "1.7",
                  color: "var(--color-text-muted)",
                  marginBottom: "36px",
                  maxWidth: "480px",
                }}
              >
                Traceable identifies every company visiting your site, scores their intent in real time, and alerts your
                sales team before the moment passes. Turn anonymous traffic into booked meetings.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <Link href="#demo" className="btn-primary" style={{ fontSize: "15px", padding: "14px 28px" }}>
                  Book a Demo
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="#how-it-works" className="btn-secondary" style={{ fontSize: "15px", padding: "13px 28px" }}>
                  See how it works
                </Link>
              </div>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "16px" }}>
                No credit card required · Installs in 2 minutes
              </p>
            </div>

            {/* Dashboard mockup */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <DashboardMockup />
            </div>
          </div>
        </div>

        <style>{`
          @media (min-width: 900px) {
            .hero-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* ── Logos bar ────────────────────────────────────────────────── */}
      <section className="section-sm" style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="container">
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: "32px",
            }}
          >
            Trusted by go-to-market teams at
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {TRUSTED_LOGOS.map((name) => (
              <div
                key={name}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 24px",
                  minWidth: "120px",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--color-text-muted)",
                  letterSpacing: "-0.01em",
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-eyebrow">How It Works</span>
            <h2 className="section-title">From anonymous visit to booked meeting in minutes</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Traceable sits quietly on your site and does the heavy lifting — no forms, no friction, no waiting.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
              position: "relative",
            }}
          >
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className="card"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  paddingTop: "40px",
                }}
              >
                {/* Step number watermark */}
                <span
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "20px",
                    fontSize: "48px",
                    fontWeight: "900",
                    color: "var(--color-border)",
                    lineHeight: 1,
                    userSelect: "none",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {step.step}
                </span>
                {/* Accent line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: i === 0 ? "var(--color-primary)" : i === 1 ? "var(--color-secondary)" : "var(--color-link)",
                  }}
                />
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--color-tertiary)",
                    marginBottom: "12px",
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: "14px", lineHeight: "1.7", margin: 0 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────── */}
      <section
        className="section"
        id="features"
        style={{
          background: "linear-gradient(180deg, var(--color-background) 0%, #F0F4FF 100%)",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-eyebrow">Features</span>
            <h2 className="section-title">Everything your team needs to act first</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              From raw session data to enriched, scored, and alerted leads — Traceable covers the entire pipeline.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card">
                <div
                  style={{
                    fontSize: "28px",
                    marginBottom: "16px",
                    lineHeight: 1,
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: "700",
                    color: "var(--color-tertiary)",
                    marginBottom: "10px",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontSize: "14px", lineHeight: "1.7", margin: 0 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ─────────────────────────────────────────────── */}
      <section className="section" id="integrations">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-eyebrow">Integrations</span>
            <h2 className="section-title">Works with your stack</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Traceable plugs into the data providers and communication tools your team already relies on.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "16px",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            {INTEGRATIONS.map((integration) => (
              <div
                key={integration.name}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "28px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "var(--shadow-sm)",
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = "var(--shadow-md)";
                  el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = "var(--shadow-sm)";
                  el.style.transform = "translateY(0)";
                }}
              >
                {/* Color pill representing the integration brand */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: integration.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "800",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {integration.name[0]}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--color-tertiary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      <section
        id="demo"
        style={{
          background: "var(--color-primary)",
          padding: "80px 0",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: "800",
              color: "white",
              letterSpacing: "-0.03em",
              marginBottom: "16px",
              lineHeight: 1.15,
            }}
          >
            Start catching high-intent visitors today.
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.85)",
              marginBottom: "36px",
              maxWidth: "480px",
              margin: "0 auto 36px",
              lineHeight: 1.6,
            }}
          >
            Join 500+ revenue teams who never let a hot lead go unnoticed. Setup takes under 2 minutes.
          </p>
          <Link
            href="#demo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "white",
              color: "var(--color-primary)",
              fontWeight: "700",
              fontSize: "15px",
              padding: "14px 32px",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 8px 28px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
            }}
          >
            Book a Demo
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginTop: "16px" }}>
            No credit card · Free 14-day trial · Cancel anytime
          </p>
        </div>
      </section>
    </>
  );
}
