"use client";

export default function SalesAgentPage() {
  return (
    <main style={{ background: "var(--color-background)", fontFamily: "Instrument Sans, sans-serif" }}>
      <style>{`
        @media (max-width: 900px) {
          .sa-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .sa-compare-grid { grid-template-columns: 1fr !important; }
          .sa-compare-old { border-radius: 16px 16px 0 0 !important; }
          .sa-compare-new { border-radius: 0 0 16px 16px !important; }
          .sa-compare-vs { display: none !important; }
          .sa-how-grid { grid-template-columns: 1fr 1fr !important; }
          .sa-features-grid { grid-template-columns: 1fr 1fr !important; }
          .sa-walkthrough-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .sa-metrics-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .sa-how-grid { grid-template-columns: 1fr !important; }
          .sa-features-grid { grid-template-columns: 1fr !important; }
          .sa-how-card { border-radius: var(--radius-lg) !important; }
        }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="section"
        style={{
          background: "linear-gradient(160deg, #093555 0%, #0d4a72 55%, #1a6b94 100%)",
          paddingTop: "100px",
          paddingBottom: "100px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background texture */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(ellipse at 70% 50%, rgba(255,114,92,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(9,132,134,0.15) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div
            className="sa-hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "64px",
              alignItems: "center",
            }}
          >
            {/* Left: copy */}
            <div>
              <span
                className="section-eyebrow"
                style={{
                  background: "rgba(255,114,92,0.18)",
                  color: "#FF9E8E",
                  marginBottom: "24px",
                }}
              >
                ✦ Meet Your Sales Agent
              </span>

              <h1
                style={{
                  fontSize: "clamp(32px, 4.5vw, 52px)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: "#ffffff",
                  letterSpacing: "-0.03em",
                  marginBottom: "24px",
                }}
              >
                Your AI rep that never sleeps —{" "}
                <span style={{ color: "#FF9E8E" }}>and always knows who to call.</span>
              </h1>

              <p
                style={{
                  fontSize: "18px",
                  lineHeight: 1.75,
                  color: "rgba(255,255,255,0.78)",
                  marginBottom: "40px",
                  maxWidth: "480px",
                }}
              >
                Traceable's Sales Agent monitors every visit, identifies decision-makers,
                scores intent in real time, and drops a ready-to-send Slack alert with a
                personalized first line. Your reps just hit send.
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <a href="#demo" className="btn-primary" style={{ fontSize: "16px", padding: "14px 28px" }}>
                  See it in action →
                </a>
                <a
                  href="#demo"
                  className="btn-secondary"
                  style={{
                    fontSize: "16px",
                    padding: "14px 28px",
                    borderColor: "rgba(255,255,255,0.25)",
                    color: "rgba(255,255,255,0.9) !important",
                    background: "rgba(255,255,255,0.08)",
                  }}
                >
                  Request demo
                </a>
              </div>
            </div>

            {/* Right: mock Slack alert */}
            <div>
              <SlackAlertCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem vs Solution ──────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-background)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-eyebrow">Why it matters</span>
            <h2 className="section-title">Stop guessing. Start knowing.</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Most sales teams are flying blind. Traceable gives your reps x-ray vision into
              who's on your site and exactly why they're there.
            </p>
          </div>

          <div
            className="sa-compare-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: "0",
              alignItems: "stretch",
            }}
          >
            {/* Old way */}
            <div
              className="sa-compare-old"
              style={{
                background: "#fff8f7",
                border: "1px solid #fde0da",
                borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
                padding: "40px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(218,98,79,0.1)",
                  color: "#DA624F",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "4px 14px",
                  borderRadius: "999px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "28px",
                }}
              >
                ✕ The old way
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  ["🎯", "Reps guess who to call next based on gut feel"],
                  ["🔍", "Manual LinkedIn research burns hours every day"],
                  ["🥶", "Cold outreach with zero context or relevance"],
                  ["⏰", "Timing is always off — you call too early or too late"],
                  ["📋", "Data is stale the moment it enters the CRM"],
                ].map(([icon, text]) => (
                  <li
                    key={String(text)}
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                      fontSize: "15px",
                      color: "#6b7280",
                      lineHeight: 1.6,
                    }}
                  >
                    <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* VS divider */}
            <div
              className="sa-compare-vs"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                width: "72px",
              }}
            >
              <div
                style={{
                  width: "1px",
                  flex: 1,
                  background: "linear-gradient(to bottom, transparent, #e8e4e0, #e8e4e0, transparent)",
                }}
              />
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--color-tertiary)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "13px",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: "0 4px 16px rgba(9,53,85,0.25)",
                }}
              >
                VS
              </div>
              <div
                style={{
                  width: "1px",
                  flex: 1,
                  background: "linear-gradient(to bottom, transparent, #e8e4e0, #e8e4e0, transparent)",
                }}
              />
            </div>

            {/* Traceable way */}
            <div
              className="sa-compare-new"
              style={{
                background: "linear-gradient(135deg, #f0fafa 0%, #f4f9ff 100%)",
                border: "1px solid #c3dfe0",
                borderRadius: "0 var(--radius-lg) var(--radius-lg) 0",
                padding: "40px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(9,132,134,0.12)",
                  color: "#098486",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "4px 14px",
                  borderRadius: "999px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "28px",
                }}
              >
                ✓ The Traceable way
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  ["⚡", "Intent signals surface the right lead in real time"],
                  ["📊", "Enriched company + contact data, instantly ready"],
                  ["🔥", "Warm first touch — you know exactly what they read"],
                  ["🎯", "Visit-triggered timing means you reach them at peak interest"],
                  ["🔄", "Always fresh — pulled live from the current session"],
                ].map(([icon, text]) => (
                  <li
                    key={String(text)}
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                      fontSize: "15px",
                      color: "#374151",
                      lineHeight: 1.6,
                    }}
                  >
                    <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
                    <span style={{ fontWeight: 500 }}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-tertiary)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <span
              className="section-eyebrow"
              style={{
                background: "rgba(255,114,92,0.18)",
                color: "#FF9E8E",
              }}
            >
              How it works
            </span>
            <h2
              className="section-title"
              style={{ color: "#ffffff", marginBottom: "16px" }}
            >
              From anonymous visit to Slack alert in seconds.
            </h2>
            <p
              className="section-subtitle"
              style={{ color: "rgba(255,255,255,0.65)", margin: "0 auto" }}
            >
              Four steps. Fully automated. Zero manual work from your reps.
            </p>
          </div>

          <div
            className="sa-how-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "2px",
              position: "relative",
            }}
          >
            {[
              {
                step: "01",
                title: "Visitor lands on your site",
                desc: "Our lightweight pixel captures session data instantly — IP, referrer, pages, scroll depth, and time-on-page. No cookies required.",
                icon: "🌐",
                color: "#FF725C",
              },
              {
                step: "02",
                title: "Identity resolved in seconds",
                desc: "RB2B matches the visitor to a named professional. IPinfo resolves the company from the IP. Unknown traffic becomes known people.",
                icon: "🔍",
                color: "#FF9E8E",
              },
              {
                step: "03",
                title: "Agent enriches and scores",
                desc: "Apollo pulls firmographics, tech stack, and contacts. Our scoring engine weighs page category, recency, return visits, and ICP fit.",
                icon: "🧠",
                color: "#7EC8C8",
              },
              {
                step: "04",
                title: "Alert lands in Slack",
                desc: "A fully structured card arrives in your sales channel — company, contact, intent score, pages visited, ICP fit, and a ready-to-send draft opener.",
                icon: "⚡",
                color: "#4ADE80",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: i === 0 ? "var(--radius-lg) 0 0 var(--radius-lg)" : i === 3 ? "0 var(--radius-lg) var(--radius-lg) 0" : "0",
                  padding: "40px 32px",
                  position: "relative",
                  transition: "background 0.2s ease",
                }}
              >
                {/* Connector arrow */}
                {i < 3 && (
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      right: "-18px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "36px",
                      height: "36px",
                      background: "var(--color-tertiary)",
                      border: "2px solid rgba(255,255,255,0.15)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "14px",
                      zIndex: 2,
                    }}
                  >
                    →
                  </div>
                )}

                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "var(--radius-md)",
                    background: `${item.color}22`,
                    border: `1px solid ${item.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    marginBottom: "20px",
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    fontSize: "48px",
                    fontWeight: 900,
                    color: item.color,
                    opacity: 0.35,
                    lineHeight: 1,
                    marginBottom: "12px",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {item.step}
                </div>

                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#ffffff",
                    marginBottom: "12px",
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.7,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features in depth ────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-background)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-eyebrow">Feature breakdown</span>
            <h2 className="section-title">Everything your reps need. Nothing they don't.</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              The Sales Agent is a complete intelligence layer — not just another notification tool.
            </p>
          </div>

          <div
            className="sa-features-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
            }}
          >
            {[
              {
                icon: "📈",
                title: "Real-Time Intent Scoring",
                desc: "Weighted scoring engine evaluates page visits, time-on-page, return frequency, and page category (pricing, case studies, docs) to produce a 0–100 intent score.",
              },
              {
                icon: "🪪",
                title: "Person-Level Identification",
                desc: "RB2B pixel resolves anonymous visitors to named professionals — name, title, company, and LinkedIn URL — with no cookie consent required.",
              },
              {
                icon: "🏢",
                title: "Company Intelligence",
                desc: "IPinfo + Apollo surfaces company size, industry, annual revenue, funding stage, tech stack, and ICP fit score alongside every alert.",
              },
              {
                icon: "✍️",
                title: "AI-Drafted Opener",
                desc: "The Sales Agent writes a personalized first-touch line based on the visitor's specific journey — pages visited, time spent, and company context. Never generic.",
              },
              {
                icon: "🔕",
                title: "Dedup & Frequency Control",
                desc: "No alert spam. The same company won't trigger more than one alert per 24-hour window, keeping your Slack clean and your reps focused.",
              },
              {
                icon: "🔗",
                title: "CRM-Ready Output",
                desc: "Every alert includes structured data — name, title, company, intent score, pages, and draft copy — formatted to paste directly into Salesforce, HubSpot, or any CRM.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card"
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(255,114,92,0.08)",
                    border: "1px solid rgba(255,114,92,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "var(--color-tertiary)",
                      marginBottom: "8px",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "14px", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live alert walkthrough ────────────────────────────────────── */}
      <section
        className="section"
        style={{
          background: "linear-gradient(135deg, #f4f9ff 0%, #f0fafa 100%)",
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-eyebrow">Alert walkthrough</span>
            <h2 className="section-title">Every piece of the alert, explained.</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              A single Slack message contains everything your rep needs to make a warm, confident first call.
            </p>
          </div>

          <div
            className="sa-walkthrough-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "64px",
              alignItems: "center",
            }}
          >
            {/* Annotated alert */}
            <div style={{ position: "relative" }}>
              <AnnotatedSlackAlert />
            </div>

            {/* Callout list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {[
                {
                  num: "1",
                  label: "Company + logo",
                  desc: "Instantly recognizable brand context. Company name, domain, and a logo fetched from Clearbit.",
                },
                {
                  num: "2",
                  label: "Contact name, title & LinkedIn",
                  desc: "The specific decision-maker who visited — not just a company. Click straight to their LinkedIn profile.",
                },
                {
                  num: "3",
                  label: "Intent score badge",
                  desc: "0–100 score with color coding (green 70+, amber 40–69, red <40) based on behavioral signals.",
                },
                {
                  num: "4",
                  label: "Pages visited timeline",
                  desc: "Exact pages, visit count, and time-on-page — so you know if they studied pricing or just browsed the blog.",
                },
                {
                  num: "5",
                  label: "ICP fit score",
                  desc: "How closely this company matches your ideal customer profile based on firmographics and tech stack.",
                },
                {
                  num: "6",
                  label: "AI-drafted opener",
                  desc: "One ready-to-send line referencing their actual session. Copy it, paste it, hit send.",
                },
              ].map((item) => (
                <div key={item.num} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    {item.num}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "var(--color-tertiary)",
                        marginBottom: "4px",
                      }}
                    >
                      {item.label}
                    </div>
                    <p style={{ fontSize: "14px", lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics ──────────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-surface)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="section-eyebrow">By the numbers</span>
            <h2 className="section-title">Results your board will notice.</h2>
          </div>

          <div
            className="sa-metrics-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "32px",
            }}
          >
            {[
              {
                stat: "3.2×",
                label: "faster first response",
                sub: "vs. cold list-based SDRs",
                color: "var(--color-primary)",
              },
              {
                stat: "68%",
                label: "higher connect rate",
                sub: "on intent-triggered outreach",
                color: "var(--color-secondary)",
              },
              {
                stat: "2.1×",
                label: "more pipeline per rep",
                sub: "when using Traceable alerts",
                color: "var(--color-link)",
              },
            ].map((m) => (
              <div
                key={m.stat}
                style={{
                  textAlign: "center",
                  padding: "48px 32px",
                  background: "var(--color-background)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(52px, 6vw, 72px)",
                    fontWeight: 900,
                    color: m.color,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    marginBottom: "12px",
                  }}
                >
                  {m.stat}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--color-tertiary)",
                    marginBottom: "6px",
                  }}
                >
                  {m.label}
                </div>
                <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ──────────────────────────────────────────────── */}
      <section
        className="section"
        style={{
          background: "var(--color-background)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div className="container">
          <div
            style={{
              maxWidth: "780px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "24px", lineHeight: 1 }}>
              "
            </div>
            <blockquote
              style={{
                fontSize: "clamp(20px, 2.5vw, 26px)",
                fontWeight: 600,
                color: "var(--color-tertiary)",
                lineHeight: 1.5,
                letterSpacing: "-0.02em",
                marginBottom: "40px",
                fontStyle: "normal",
              }}
            >
              We used to spend the first hour of every morning building a call list. With
              Traceable, we wake up and the list is already in Slack — with context that used
              to take 20 minutes of research per account. Our connect rate jumped 60% in the
              first month.
            </blockquote>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF725C, #DA624F)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "18px",
                }}
              >
                MR
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, color: "var(--color-tertiary)", fontSize: "15px" }}>
                  Marcus Reid
                </div>
                <div style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
                  VP of Sales, Cascara Technologies
                </div>
              </div>
              <div
                style={{
                  marginLeft: "8px",
                  padding: "4px 12px",
                  background: "rgba(9,132,134,0.1)",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-link)",
                }}
              >
                Verified customer
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section
        className="section"
        id="demo"
        style={{
          background: "linear-gradient(160deg, #093555 0%, #0d4a72 100%)",
          textAlign: "center",
        }}
      >
        <div className="container">
          <span
            className="section-eyebrow"
            style={{
              background: "rgba(255,114,92,0.18)",
              color: "#FF9E8E",
              marginBottom: "28px",
            }}
          >
            Get started today
          </span>
          <h2
            style={{
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              marginBottom: "20px",
              lineHeight: 1.1,
            }}
          >
            Give your reps an unfair advantage.
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.7)",
              maxWidth: "480px",
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            See how Traceable's Sales Agent turns anonymous site traffic into a warm, prioritized
            pipeline — in less than 48 hours.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="#"
              className="btn-primary"
              style={{ fontSize: "16px", padding: "16px 32px" }}
            >
              Book a Demo →
            </a>
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
                fontSize: "15px",
                padding: "16px 24px",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              Or view pricing →
            </a>
          </div>

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "28px" }}>
            No credit card required · Live in 48 hours · Cancels anytime
          </p>
        </div>
      </section>
    </main>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SlackAlertCard() {
  return (
    <div
      style={{
        background: "#1A1D21",
        borderRadius: "16px",
        padding: "4px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      {/* Slack window chrome */}
      <div
        style={{
          background: "#19171D",
          borderRadius: "14px 14px 0 0",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div
              key={c}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
        </div>
        <span
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: "12px",
            marginLeft: "8px",
            fontFamily: "monospace",
          }}
        >
          #sales-alerts · Traceable
        </span>
      </div>

      {/* Message body */}
      <div style={{ padding: "20px 20px 24px", background: "#222529", borderRadius: "0 0 14px 14px" }}>
        {/* Bot avatar + name */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #FF725C, #DA624F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            👁
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "15px" }}>
                Traceable
              </span>
              <span
                style={{
                  background: "#1264A3",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: "3px",
                }}
              >
                APP
              </span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
                2:47 PM
              </span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginTop: "2px" }}>
              🔥 High-intent visitor detected
            </div>
          </div>
        </div>

        {/* Alert card */}
        <div
          style={{
            background: "#2C2F33",
            borderRadius: "10px",
            overflow: "hidden",
            borderLeft: "4px solid #FF725C",
          }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "16px 18px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "14px",
                }}
              >
                AC
              </div>
              <div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "15px" }}>
                  Acme Corp
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                  acmecorp.io · Series B · 320 employees
                </div>
              </div>
            </div>
            <div
              style={{
                background: "rgba(74,222,128,0.15)",
                border: "1px solid rgba(74,222,128,0.35)",
                color: "#4ADE80",
                fontWeight: 800,
                fontSize: "13px",
                padding: "4px 10px",
                borderRadius: "6px",
              }}
            >
              87/100
            </div>
          </div>

          {/* Contact row */}
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #06B6D4, #0891B2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              SC
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#ffffff", fontWeight: 600, fontSize: "14px" }}>
                Sarah Chen
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                VP Engineering · linkedin.com/in/sarah-chen
              </div>
            </div>
            <div
              style={{
                background: "rgba(99,102,241,0.2)",
                color: "#A5B4FC",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              ICP ✓
            </div>
          </div>

          {/* Pages visited */}
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "8px", textTransform: "uppercase" }}>
              Pages visited
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {[
                { page: "/pricing", count: "× 3", time: "8m 42s", hot: true },
                { page: "/case-studies/scale-ai", count: "× 1", time: "3m 11s", hot: false },
              ].map((p) => (
                <div
                  key={p.page}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: p.hot ? "#FF9E8E" : "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                    {p.page}
                  </span>
                  <span
                    style={{
                      background: p.hot ? "rgba(255,114,92,0.2)" : "rgba(255,255,255,0.07)",
                      color: p.hot ? "#FF9E8E" : "rgba(255,255,255,0.4)",
                      fontSize: "11px",
                      padding: "1px 6px",
                      borderRadius: "3px",
                      fontWeight: 600,
                    }}
                  >
                    {p.count}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginLeft: "auto" }}>
                    {p.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Draft opener */}
          <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "8px", textTransform: "uppercase" }}>
              ✍️ Draft opener
            </div>
            <p
              style={{
                color: "#E2E8F0",
                fontSize: "13px",
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              "Hi Sarah — noticed you've been deep in our pricing page a few times today. Happy
              to walk you through what Acme Corp's setup would look like and what the ROI tends
              to be for engineering-led orgs at your stage."
            </p>
          </div>

          {/* Actions */}
          <div style={{ padding: "12px 18px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              style={{
                background: "#FF725C",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Copy opener
            </button>
            <button
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View full session →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnotatedSlackAlert() {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          background: "#1A1D21",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Chrome */}
        <div
          style={{
            background: "#19171D",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: "6px" }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
            ))}
          </div>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginLeft: "6px", fontFamily: "monospace" }}>
            #sales-alerts
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "16px", background: "#222529" }}>
          {/* Alert card */}
          <div
            style={{
              background: "#2C2F33",
              borderRadius: "8px",
              overflow: "hidden",
              borderLeft: "3px solid #FF725C",
            }}
          >
            {/* Row 1: company */}
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
              }}
              data-label="1"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "linear-gradient(135deg, #4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "11px" }}>AC</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: "13px" }}>Acme Corp</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>acmecorp.io · 320 employees</div>
                </div>
              </div>
              <div style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ADE80", fontWeight: 800, fontSize: "12px", padding: "3px 8px", borderRadius: "5px" }}>87</div>
            </div>

            {/* Row 2: contact */}
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              data-label="2"
            >
              <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg,#06B6D4,#0891B2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "10px", flexShrink: 0 }}>SC</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>Sarah Chen · VP Engineering</div>
                <div style={{ color: "#5B9BD5", fontSize: "11px" }}>linkedin.com/in/sarah-chen ↗</div>
              </div>
              <div style={{ background: "rgba(99,102,241,0.2)", color: "#A5B4FC", fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "3px" }}>ICP ✓</div>
            </div>

            {/* Row 3: pages */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "6px", textTransform: "uppercase" }}>Pages visited</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ color: "#FF9E8E", fontFamily: "monospace" }}>/pricing</span>
                  <span style={{ background: "rgba(255,114,92,0.2)", color: "#FF9E8E", fontSize: "10px", padding: "1px 5px", borderRadius: "3px" }}>× 3</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto", fontSize: "10px" }}>8m 42s</span>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>/case-studies</span>
                  <span style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", fontSize: "10px", padding: "1px 5px", borderRadius: "3px" }}>× 1</span>
                  <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: "auto", fontSize: "10px" }}>3m 11s</span>
                </div>
              </div>
            </div>

            {/* Row 4: draft */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", marginBottom: "6px", textTransform: "uppercase" }}>✍️ AI Draft opener</div>
              <p style={{ color: "#E2E8F0", fontSize: "12px", lineHeight: 1.55, fontStyle: "italic" }}>
                "Hi Sarah — noticed you've been deep in our pricing page a few times today. Happy to walk you through what Acme Corp's setup would look like."
              </p>
              <a href="#" style={{ color: "#5B9BD5", fontSize: "11px", display: "inline-block", marginTop: "8px" }}>
                View full session →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Annotation dots */}
      {[
        { top: "88px", right: "-6px", num: "1", label: "Company + logo" },
        { top: "88px", left: "-6px", num: "3", label: "Intent score" },
        { top: "136px", right: "-6px", num: "2", label: "Contact + LinkedIn" },
        { top: "136px", left: "-6px", num: "5", label: "ICP fit" },
        { top: "196px", right: "-6px", num: "4", label: "Pages timeline" },
        { top: "260px", right: "-6px", num: "6", label: "Draft opener" },
      ].map((dot) => (
        <div
          key={dot.num}
          style={{
            position: "absolute",
            top: dot.top,
            ...(dot.right ? { right: dot.right } : { left: dot.left }),
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "var(--color-primary)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: 800,
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(255,114,92,0.4)",
          }}
        >
          {dot.num}
        </div>
      ))}
    </div>
  );
}

