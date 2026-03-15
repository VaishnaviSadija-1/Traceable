"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Industry = "All" | "SaaS" | "Enterprise" | "Agency" | "FinTech";

interface CaseStudyCard {
  id: number;
  company: string;
  industry: Industry;
  logo: string;
  resultHeadline: string;
  challenge: string;
  outcome: string;
  metrics: { label: string; value: string }[];
  customerName: string;
  customerTitle: string;
  initials: string;
  avatarColor: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FILTERS: Industry[] = ["All", "SaaS", "Enterprise", "Agency", "FinTech"];

const CASE_STUDIES: CaseStudyCard[] = [
  {
    id: 1,
    company: "Pathfinder AI",
    industry: "SaaS",
    logo: "PA",
    resultHeadline: "Identified decision-makers from 3 Fortune 500 visitors in week one.",
    challenge:
      "Pathfinder's marketing team was running LinkedIn campaigns but had no way to connect ad spend to actual site visits from target accounts.",
    outcome:
      "With Traceable, they identified three Fortune 500 companies in their ICP within the first week — two of which became active deals within 30 days.",
    metrics: [
      { label: "Enterprise leads/mo", value: "12" },
      { label: "Reply rate", value: "43%" },
      { label: "Influenced pipeline", value: "$1.2M" },
    ],
    customerName: "Priya Nair",
    customerTitle: "Head of Demand Gen",
    initials: "PN",
    avatarColor: "#495883",
  },
  {
    id: 2,
    company: "Cascade HR",
    industry: "SaaS",
    logo: "CH",
    resultHeadline: "Traceable told us a 500-person company visited Pricing 4 times. We called. They closed.",
    challenge:
      "Cascade's SDR team was spending 80% of their time on outbound sequences with no intent signal — just industry lists and guesswork.",
    outcome:
      "Now every rep starts their day with a feed of warm accounts. They know the company size, pages visited, and time on site before dialing.",
    metrics: [
      { label: "Faster sales cycle", value: "31%" },
      { label: "Warm touches/mo", value: "18" },
      { label: "ROI in 60 days", value: "5×" },
    ],
    customerName: "Derek Okafor",
    customerTitle: "VP of Sales",
    initials: "DO",
    avatarColor: "#098486",
  },
  {
    id: 3,
    company: "Vertex Capital",
    industry: "FinTech",
    logo: "VC",
    resultHeadline: "Our AEs stopped cold calling lists and started working warm intent signals.",
    challenge:
      "Vertex's account executives were working cold lists purchased from a data vendor. Connect rates were under 4% and morale was suffering.",
    outcome:
      "After deploying Traceable, AEs only reached out to companies who had visited their site in the past 7 days. Connect rate more than doubled overnight.",
    metrics: [
      { label: "Increase in connect rate", value: "62%" },
      { label: "Meetings booked", value: "2.1×" },
      { label: "Pipeline growth", value: "+89%" },
    ],
    customerName: "Sandra Reyes",
    customerTitle: "Director of Revenue",
    initials: "SR",
    avatarColor: "#DA624F",
  },
  {
    id: 4,
    company: "Bloom Agency",
    industry: "Agency",
    logo: "BA",
    resultHeadline: "We resell Traceable's signals to our B2B clients as a lead gen service.",
    challenge:
      "Bloom was struggling to differentiate its B2B lead gen offering from competitors who all used the same ZoomInfo-based lists.",
    outcome:
      "They white-labeled Traceable's visitor intelligence into a premium \"Intent IQ\" package — now their highest-margin and fastest-growing service line.",
    metrics: [
      { label: "New annual revenue", value: "$40K" },
      { label: "Clients onboarded", value: "8" },
      { label: "Client retention", value: "94%" },
    ],
    customerName: "Tanya Goldstein",
    customerTitle: "Founder & CEO",
    initials: "TG",
    avatarColor: "#093555",
  },
  {
    id: 5,
    company: "Ironclad Systems",
    industry: "Enterprise",
    logo: "IS",
    resultHeadline: "Our enterprise SDRs now open with the exact page the prospect visited. They love it.",
    challenge:
      "With 12 SDRs covering 6 verticals, Ironclad needed a scalable way to route intent signals to the right rep without adding ops overhead.",
    outcome:
      "Traceable's Slack integration pushes alerts directly to each SDR's channel, tagged by vertical. They open every call with full context — no more cold openers.",
    metrics: [
      { label: "SDR productivity", value: "3.4×" },
      { label: "Cold opens eliminated", value: "0" },
      { label: "Enterprise touches/mo", value: "22" },
    ],
    customerName: "James Whitfield",
    customerTitle: "SDR Manager",
    initials: "JW",
    avatarColor: "#495883",
  },
  {
    id: 6,
    company: "Nova Commerce",
    industry: "SaaS",
    logo: "NC",
    resultHeadline: "We caught a Series B company on our pricing page at 11pm. Slacked them at 9am. Closed in 3 weeks.",
    challenge:
      "Nova's sales team was only following up on inbound form fills — which represented less than 2% of their total site traffic.",
    outcome:
      "One Traceable alert flagged a high-growth Series B company browsing pricing late at night. The AE reached out first thing the next morning. Deal closed in 21 days.",
    metrics: [
      { label: "Faster close", value: "71%" },
      { label: "Deal value", value: "$220K" },
      { label: "Traceable alerts", value: "1" },
    ],
    customerName: "Amara Singh",
    customerTitle: "AE, Enterprise",
    initials: "AS",
    avatarColor: "#098486",
  },
];

const TESTIMONIALS = [
  { quote: "We had no idea who was on our site. Now we know before they fill out a form.", company: "Ridgeline SaaS" },
  { quote: "Three qualified pipeline opportunities in the first week. Unreal.", company: "Beacon Analytics" },
  { quote: "Our SDRs call it their 'cheat code.' I call it our competitive edge.", company: "Pillar Ops" },
  { quote: "Setup took 20 minutes. First alert came 4 hours later.", company: "Crest FinTech" },
  { quote: "We closed a $180K deal because Traceable told us they were on pricing.", company: "Flint Commerce" },
  { quote: "Finally, intent signals that actually match our ICP.", company: "Summit HR" },
  { quote: "Our agency now offers this as a premium add-on. Clients love it.", company: "Wren Digital" },
  { quote: "The RB2B person-level match blew our team away. Name, title, LinkedIn.", company: "Crater AI" },
  { quote: "I ran out of leads to call from Traceable — in a good way.", company: "Apex Enterprise" },
  { quote: "Replaced two data vendors with one Traceable plan. Half the cost.", company: "Dune Capital" },
  { quote: "Our connect rate went from 3% to 19% in the first month.", company: "Fieldstone SaaS" },
  { quote: "Every morning I wake up to a list of companies who want to hear from me.", company: "Prism Revenue" },
];

const INTEGRATIONS = [
  { name: "Salesforce", abbr: "SF", color: "#00A1E0" },
  { name: "HubSpot", abbr: "HS", color: "#FF7A59" },
  { name: "Outreach", abbr: "OR", color: "#5951FF" },
  { name: "Apollo", abbr: "AP", color: "#1D3461" },
  { name: "Slack", abbr: "SL", color: "#4A154B" },
  { name: "LinkedIn Sales Nav", abbr: "LI", color: "#0A66C2" },
];

// ── Components ────────────────────────────────────────────────────────────────

function IndustryBadge({ label }: { label: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    SaaS: { bg: "rgba(73,88,131,0.1)", color: "#495883" },
    Enterprise: { bg: "rgba(9,53,85,0.1)", color: "#093555" },
    Agency: { bg: "rgba(9,132,134,0.1)", color: "#098486" },
    FinTech: { bg: "rgba(218,98,79,0.12)", color: "#DA624F" },
  };
  const style = colorMap[label] || { bg: "rgba(0,0,0,0.06)", color: "#555" };
  return (
    <span
      style={{
        display: "inline-block",
        background: style.bg,
        color: style.color,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: "999px",
      }}
    >
      {label}
    </span>
  );
}

function Avatar({
  initials,
  color,
  size = 40,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

function MetricPill({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        background: "var(--color-background)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: "10px 14px",
        textAlign: "center",
        flex: "1 1 0",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "var(--color-primary)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          marginTop: "3px",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function CaseStudyCardComponent({ card }: { card: CaseStudyCard }) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "28px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-sm)",
            background: "var(--color-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 800,
            fontSize: "13px",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {card.logo}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-tertiary)" }}>{card.company}</div>
        </div>
        <IndustryBadge label={card.industry} />
      </div>

      {/* Result headline */}
      <p
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--color-tertiary)",
          lineHeight: 1.45,
          margin: 0,
        }}
      >
        &ldquo;{card.resultHeadline}&rdquo;
      </p>

      {/* Challenge + Outcome */}
      <p style={{ fontSize: "14px", color: "var(--color-text-muted)", lineHeight: 1.65, margin: 0 }}>
        {card.challenge} {card.outcome}
      </p>

      {/* Metrics */}
      <div style={{ display: "flex", gap: "8px" }}>
        {card.metrics.map((m) => (
          <MetricPill key={m.label} value={m.value} label={m.label} />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "4px",
          borderTop: "1px solid var(--color-border-light)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Avatar initials={card.initials} color={card.avatarColor} size={34} />
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-tertiary)" }}>
              {card.customerName}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{card.customerTitle}</div>
          </div>
        </div>
        <a
          href="#"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-link)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
          }}
        >
          Read story →
        </a>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CaseStudiesPage() {
  const [activeFilter, setActiveFilter] = useState<Industry>("All");

  const filteredStudies =
    activeFilter === "All"
      ? CASE_STUDIES
      : CASE_STUDIES.filter((cs) => cs.industry === activeFilter);

  return (
    <main style={{ background: "var(--color-background)" }}>
      {/* ── 1. Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="section"
        style={{
          background: "linear-gradient(180deg, #fff 0%, var(--color-background) 100%)",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "48px",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <span className="section-eyebrow">Customer Stories</span>
          <h1
            className="section-title"
            style={{ maxWidth: "700px", margin: "0 auto 16px", fontSize: "clamp(32px, 5vw, 52px)" }}
          >
            How B2B teams turn anonymous traffic into pipeline.
          </h1>
          <p className="section-subtitle" style={{ margin: "0 auto 48px", maxWidth: "580px", textAlign: "center" }}>
            See how sales and marketing teams use Traceable to identify high-intent visitors and convert them before
            competitors do.
          </p>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "999px",
                  border: "1.5px solid",
                  borderColor: activeFilter === filter ? "var(--color-primary)" : "var(--color-border)",
                  background: activeFilter === filter ? "var(--color-primary)" : "var(--color-surface)",
                  color: activeFilter === filter ? "white" : "var(--color-text-muted)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Featured Case Study ─────────────────────────────────────────────── */}
      <section style={{ padding: "64px 0 0" }}>
        <div className="container">
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            {/* Top accent bar */}
            <div
              style={{
                height: "4px",
                background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
              }}
            />

            <div style={{ padding: "48px" }}>
              {/* Company header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "20px",
                  marginBottom: "32px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "16px",
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                  }}
                >
                  MA
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, fontSize: "20px", color: "var(--color-tertiary)" }}>
                      Meridian Analytics
                    </span>
                    <IndustryBadge label="SaaS" />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "var(--color-text-muted)",
                        background: "var(--color-background)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "999px",
                        padding: "2px 10px",
                      }}
                    >
                      ⚡ Featured Story
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>140 employees</span>
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Austin, TX</span>
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>B2B data analytics</span>
                  </div>
                </div>
              </div>

              {/* Two-column layout */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "48px",
                  alignItems: "start",
                }}
                className="featured-grid"
              >
                {/* Left: story */}
                <div>
                  <h2
                    style={{
                      fontSize: "clamp(22px, 3vw, 30px)",
                      color: "var(--color-tertiary)",
                      lineHeight: 1.3,
                      marginBottom: "24px",
                    }}
                  >
                    Meridian went from 0 pipeline visibility to 47 qualified alerts in the first month.
                  </h2>

                  <div style={{ marginBottom: "20px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--color-primary-dark)",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      The Challenge
                    </span>
                    <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--color-text-muted)" }}>
                      Their website was getting 8,000 monthly visitors but the sales team had no idea who they were or
                      what they cared about. Every rep was flying blind, relying on a trickle of inbound form fills that
                      represented less than 1% of total traffic.
                    </p>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--color-link)",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      The Solution
                    </span>
                    <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--color-text-muted)" }}>
                      They deployed Traceable in an afternoon — one script tag and a Slack connection. Within 72 hours,
                      they had identified 23 companies by IP and 11 person-level matches via RB2B, complete with names,
                      titles, and LinkedIn profiles.
                    </p>
                  </div>
                </div>

                {/* Right: metrics + quote */}
                <div>
                  {/* Stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "12px",
                      marginBottom: "32px",
                    }}
                  >
                    {[
                      { value: "47", label: "qualified alerts / month", suffix: "" },
                      { value: "$380K", label: "new pipeline in 90 days", suffix: "" },
                      { value: "2.8×", label: "faster first response time", suffix: "" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: "var(--color-background)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-md)",
                          padding: "20px 24px",
                          display: "flex",
                          alignItems: "center",
                          gap: "20px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "36px",
                            fontWeight: 800,
                            color: "var(--color-primary)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1,
                            minWidth: "80px",
                          }}
                        >
                          {stat.value}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "var(--color-text-muted)",
                            lineHeight: 1.4,
                          }}
                        >
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Quote */}
                  <div
                    style={{
                      background: "rgba(255,114,92,0.06)",
                      border: "1px solid rgba(255,114,92,0.2)",
                      borderLeft: "3px solid var(--color-primary)",
                      borderRadius: "var(--radius-sm)",
                      padding: "20px 24px",
                      marginBottom: "28px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "16px",
                        fontStyle: "italic",
                        color: "var(--color-tertiary)",
                        lineHeight: 1.55,
                        margin: "0 0 12px",
                      }}
                    >
                      &ldquo;We used to guess. Now we know exactly who to call and why.&rdquo;
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Avatar initials="ML" color="#093555" size={32} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-tertiary)" }}>
                        Marcus Lee, VP Sales — Meridian Analytics
                      </span>
                    </div>
                  </div>

                  <a href="#" className="btn-primary">
                    Read full story →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Case Study Grid ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          {filteredStudies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <p style={{ fontSize: "16px", color: "var(--color-text-muted)" }}>
                No case studies found for &ldquo;{activeFilter}&rdquo; yet. More coming soon.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "24px",
              }}
            >
              {filteredStudies.map((card) => (
                <CaseStudyCardComponent key={card.id} card={card} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. By the Numbers ─────────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(255,114,92,0.12) 0%, rgba(73,88,131,0.08) 100%)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          padding: "80px 0",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-eyebrow">By the Numbers</span>
            <h2 className="section-title">
              Results that speak for themselves.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "2px",
              background: "var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {[
              { value: "4,200+", label: "companies identified last month", icon: "🏢" },
              { value: "$28M", label: "in pipeline influenced", icon: "💰" },
              { value: "94%", label: "customer retention rate", icon: "🔁" },
              { value: "< 5 min", label: "avg time to first alert after setup", icon: "⚡" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: "var(--color-surface)",
                  padding: "40px 32px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>{stat.icon}</div>
                <div
                  style={{
                    fontSize: "clamp(32px, 4vw, 44px)",
                    fontWeight: 900,
                    color: "var(--color-primary)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    marginBottom: "10px",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.4,
                    maxWidth: "160px",
                    margin: "0 auto",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Integration Badges ─────────────────────────────────────────────── */}
      <section style={{ padding: "72px 0", borderBottom: "1px solid var(--color-border)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              Works alongside your existing stack
            </p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {INTEGRATIONS.map((int) => (
              <div
                key={int.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 20px",
                  boxShadow: "var(--shadow-sm)",
                  transition: "box-shadow 0.15s ease, transform 0.15s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "6px",
                    background: int.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "10px",
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                  }}
                >
                  {int.abbr}
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-tertiary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {int.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Customer Wall ──────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 0", overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span className="section-eyebrow">What Teams Are Saying</span>
          <h2 className="section-title">Hundreds of teams. One outcome.</h2>
        </div>

        {/* Scrolling row */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            padding: "8px 24px 24px",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: "260px",
                background: i % 2 === 0 ? "var(--color-surface)" : "rgba(255,114,92,0.07)",
                border: "1px solid",
                borderColor: i % 2 === 0 ? "var(--color-border)" : "rgba(255,114,92,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--color-tertiary)",
                  lineHeight: 1.55,
                  marginBottom: "16px",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t.company}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Bottom CTA ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--color-tertiary)",
          padding: "100px 0",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,114,92,0.2)",
              color: "var(--color-primary)",
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "999px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            Get Started Today
          </span>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              color: "white",
              marginBottom: "16px",
              maxWidth: "600px",
              margin: "0 auto 16px",
            }}
          >
            Ready to see who&apos;s on your site?
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.65)",
              maxWidth: "480px",
              margin: "0 auto 40px",
              lineHeight: 1.6,
            }}
          >
            Join 4,200+ B2B teams getting warm alerts the moment high-intent visitors land on their site.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#" className="btn-primary" style={{ fontSize: "16px", padding: "15px 32px" }}>
              Book a Demo
            </a>
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontWeight: 600,
                fontSize: "15px",
                padding: "14px 28px",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
            >
              See how it works →
            </a>
          </div>
        </div>
      </section>

      {/* Mobile responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .featured-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
