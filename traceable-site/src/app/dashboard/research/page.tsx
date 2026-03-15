"use client";

import { useState } from "react";
import Badge from "../components/Badge";

interface BusinessSignal {
  type: string;
  title: string;
  detail: string;
  date?: string | null;
  source_url?: string | null;
}

interface Contact {
  full_name: string;
  title?: string | null;
  role_type?: string;
  email?: string | null;
  linkedin_url?: string | null;
}

interface ResearchResult {
  input_name: string;
  domain: string | null;
  name: string | null;
  industry: string | null;
  description: string | null;
  employee_count: number | null;
  employee_range: string | null;
  revenue_range: string | null;
  hq_city: string | null;
  hq_country: string | null;
  founded_year: number | null;
  tech_stack: string[];
  funding_stage: string | null;
  total_funding: number | null;
  contacts: Contact[];
  business_signals: BusinessSignal[];
  ai_summary: string | null;
  company_id: string | null;
  logo_url: string | null;
  error?: string;
}

const SIGNAL_ICONS: Record<string, string> = {
  hiring: "👥",
  funding: "💰",
  expansion: "🌍",
  product_launch: "🚀",
  partnership: "🤝",
};

const SIGNAL_VARIANTS: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
  hiring: "info",
  funding: "success",
  expansion: "warning",
  product_launch: "danger",
  partnership: "neutral",
};

export default function ResearchPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const companies = input
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (companies.length === 0) return;
    if (companies.length > 5) {
      setError("Maximum 5 companies per request");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setProgress(`Researching ${companies.length} ${companies.length === 1 ? "company" : "companies"}...`);

    try {
      const res = await fetch("/api/v1/internal/companies/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setProgress("");
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: 20,
    boxShadow: "var(--shadow-sm)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 4,
  };

  const valStyle: React.CSSProperties = {
    fontSize: 14,
    color: "var(--color-text)",
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-tertiary)", marginBottom: 8 }}>
        Company Research
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 24 }}>
        Enter company names to discover, enrich, and analyze account intelligence.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={labelStyle}>Company Names (one per line, max 5)</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"BrightPath Lending\nRocket Mortgage\nRedfin"}
          rows={5}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 14,
            fontFamily: "inherit",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg)",
            color: "var(--color-text)",
            resize: "vertical",
            marginBottom: 12,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: loading ? "var(--color-text-muted)" : "var(--color-primary)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {loading ? "Researching..." : "Research Companies"}
          </button>
          {progress && (
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              {progress}
            </span>
          )}
        </div>
      </form>

      {error && (
        <div style={{ ...cardStyle, marginBottom: 24, borderColor: "#dc2626", background: "rgba(220,38,38,0.04)" }}>
          <span style={{ color: "#dc2626", fontSize: 14 }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {results.map((r, idx) => (
        <div key={idx} style={{ ...cardStyle, marginBottom: 24 }}>
          {/* Company Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-sm)",
                background: `hsl(${(r.name ?? r.input_name).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 40%, 92%)`,
                color: `hsl(${(r.name ?? r.input_name).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 40%, 35%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {(r.name ?? r.input_name).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-tertiary)" }}>
                {r.name ?? r.input_name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {r.domain && <span style={{ fontSize: 13, color: "var(--color-link)" }}>{r.domain}</span>}
                {r.industry && <Badge label={r.industry} variant="info" />}
                {r.funding_stage && <Badge label={r.funding_stage} variant="success" />}
              </div>
            </div>
            {r.company_id && (
              <a
                href={`/dashboard/companies/${r.company_id}`}
                style={{
                  fontSize: 12,
                  color: "var(--color-link)",
                  padding: "6px 12px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                }}
              >
                View in Dashboard →
              </a>
            )}
          </div>

          {r.error && (
            <div style={{ padding: 12, background: "rgba(220,38,38,0.04)", borderRadius: "var(--radius-sm)", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
              {r.error}
            </div>
          )}

          {/* AI Summary */}
          {r.ai_summary && (
            <div style={{ padding: 16, background: "rgba(9,132,134,0.04)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--color-link)", marginBottom: 20, fontSize: 14, lineHeight: 1.7, color: "var(--color-text)" }}>
              {r.ai_summary}
            </div>
          )}

          {/* Firmographics */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 12 }}>Firmographics</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div><div style={labelStyle}>Employees</div><div style={valStyle}>{r.employee_count?.toLocaleString() ?? "—"}</div></div>
              <div><div style={labelStyle}>Revenue</div><div style={valStyle}>{r.revenue_range ?? "—"}</div></div>
              <div><div style={labelStyle}>HQ</div><div style={valStyle}>{[r.hq_city, r.hq_country].filter(Boolean).join(", ") || "—"}</div></div>
              <div><div style={labelStyle}>Founded</div><div style={valStyle}>{r.founded_year ?? "—"}</div></div>
              {r.total_funding != null && (
                <div><div style={labelStyle}>Total Funding</div><div style={valStyle}>${(r.total_funding / 1e6).toFixed(1)}M</div></div>
              )}
            </div>
          </div>

          {/* Tech Stack */}
          {r.tech_stack.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 12 }}>Technology Stack</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {r.tech_stack.map((tech, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(9,53,85,0.06)",
                      color: "var(--color-secondary)",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Business Signals */}
          {r.business_signals.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 12 }}>Business Signals</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {r.business_signals.map((signal, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: 12,
                      background: "var(--color-bg)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border-light)",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{SIGNAL_ICONS[signal.type] ?? "📌"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{signal.title}</span>
                        <Badge label={signal.type.replace("_", " ")} variant={SIGNAL_VARIANTS[signal.type] ?? "neutral"} />
                        {signal.date && <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{signal.date}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{signal.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts / Leadership */}
          {r.contacts.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 12 }}>Leadership</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Name", "Title", "Email", "LinkedIn"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.contacts.map((c, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 500, color: "var(--color-text)" }}>{c.full_name}</td>
                      <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>{c.title ?? "—"}</td>
                      <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>{c.email ?? "—"}</td>
                      <td style={{ padding: "8px 10px" }}>
                        {c.linkedin_url ? (
                          <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--color-link)" }}>View</a>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Description */}
          {r.description && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 8 }}>Description</h3>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6, margin: 0 }}>{r.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
