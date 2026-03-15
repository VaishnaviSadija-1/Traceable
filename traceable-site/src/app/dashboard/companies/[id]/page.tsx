export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCompanyDetail } from "@/lib/dashboard-queries";
import Badge from "../../components/Badge";
import ScoreBadge from "../../components/ScoreBadge";
import CompanyAvatar from "../../components/CompanyAvatar";
import AccountSummary from "../../components/AccountSummary";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const confidenceVariant = (c: string) => {
  switch (c) {
    case "high": return "success" as const;
    case "medium": return "warning" as const;
    default: return "neutral" as const;
  }
};

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getCompanyDetail(id);

  if (!result) {
    return (
      <div>
        <Link href="/dashboard/companies" style={{ fontSize: 13, color: "var(--color-link)" }}>← Back to Companies</Link>
        <p style={{ marginTop: 24, color: "var(--color-text-muted)" }}>Company not found.</p>
      </div>
    );
  }

  const { company, sessions, scores } = result;
  const techStack = (company.tech_stack ?? []) as string[];
  const contacts = (company.contacts ?? []) as Array<Record<string, string>>;

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
      <Link href="/dashboard/companies" style={{ fontSize: 13, color: "var(--color-link)", display: "inline-block", marginBottom: 20 }}>
        ← Back to Companies
      </Link>

      {/* Header */}
      <div style={{ ...cardStyle, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <CompanyAvatar name={company.name} size={48} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-tertiary)", marginBottom: 4 }}>
            {company.name ?? "Unknown Company"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {company.domain && <span style={{ fontSize: 14, color: "var(--color-link)" }}>{company.domain}</span>}
            {company.industry && <Badge label={company.industry} variant="info" />}
            <Badge label={company.confidence} variant={confidenceVariant(company.confidence)} />
          </div>
        </div>
      </div>

      {/* AI Account Intelligence Summary */}
      <div style={{ marginBottom: 20 }}>
        <AccountSummary
          companyId={company.id}
          companyName={company.name ?? company.domain ?? "Unknown"}
          existingSummary={company.ai_summary}
          generatedAt={company.ai_summary_generated_at}
        />
      </div>

      {/* Firmographics */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>Firmographics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          <div><div style={labelStyle}>Employees</div><div style={valStyle}>{company.employee_count?.toLocaleString() ?? "—"}</div></div>
          <div><div style={labelStyle}>Revenue</div><div style={valStyle}>{company.revenue_range ?? "—"}</div></div>
          <div><div style={labelStyle}>HQ</div><div style={valStyle}>{[company.hq_city, company.hq_country].filter(Boolean).join(", ") || "—"}</div></div>
          <div><div style={labelStyle}>Location</div><div style={valStyle}>{[company.city, company.region, company.country].filter(Boolean).join(", ") || "—"}</div></div>
          <div><div style={labelStyle}>Org</div><div style={valStyle}>{company.org ?? "—"}</div></div>
          <div><div style={labelStyle}>Enriched</div><div style={valStyle}>{company.enriched_at ? formatDate(company.enriched_at) : "Not yet"}</div></div>
        </div>
      </div>

      {/* Tech Stack */}
      {techStack.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>Tech Stack</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {techStack.map((tech, i) => (
              <span
                key={i}
                style={{
                  padding: "4px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(9,53,85,0.06)",
                  color: "var(--color-secondary)",
                }}
              >
                {typeof tech === "string" ? tech : JSON.stringify(tech)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Business Signals */}
      {(() => {
        const signals = (company as unknown as Record<string, unknown>).business_signals as Array<{ type: string; title: string; detail: string; date?: string | null }> | null;
        if (!signals || signals.length === 0) return null;
        const signalIcons: Record<string, string> = { hiring: "👥", funding: "💰", expansion: "🌍", product_launch: "🚀", partnership: "🤝" };
        return (
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>Business Signals</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {signals.map((signal, i) => (
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
                  <span style={{ fontSize: 16 }}>{signalIcons[signal.type] ?? "📌"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{signal.title}</span>
                      <Badge label={signal.type.replace("_", " ")} variant="info" />
                      {signal.date && <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{signal.date}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{signal.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Contacts */}
      {contacts.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>Contacts</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Name", "Title", "Email", "LinkedIn"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 500, color: "var(--color-text)" }}>{contact.name ?? "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>{contact.title ?? "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>{contact.email ?? "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {contact.linkedin_url ? (
                      <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>View</a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sessions */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>
          Sessions ({sessions.length})
        </h2>
        {sessions.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>No sessions recorded</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/sessions/${s.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--color-border-light)",
                  textDecoration: "none",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--color-text)", fontWeight: 500 }}>{s.landing_url}</span>
                <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{formatDate(s.created_at)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Scores History */}
      {scores.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>
            Score History ({scores.length})
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Intent", "Fit", "Lead", "Stage", "Persona", "Confidence", "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores.map((sc) => (
                <tr key={sc.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                  <td style={{ padding: "8px 12px" }}><ScoreBadge score={sc.score} /></td>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>{sc.fit_score}</td>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>{sc.lead_score}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <Badge
                      label={sc.buyer_stage}
                      variant={sc.buyer_stage === "decision" ? "danger" : sc.buyer_stage === "consideration" ? "warning" : "neutral"}
                    />
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-muted)", fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sc.persona ?? "—"}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {sc.persona_confidence != null ? (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: sc.persona_confidence >= 70 ? "rgba(22,163,74,0.1)" : sc.persona_confidence >= 50 ? "rgba(234,88,12,0.1)" : "rgba(107,114,128,0.1)",
                        color: sc.persona_confidence >= 70 ? "#16a34a" : sc.persona_confidence >= 50 ? "#ea580c" : "#6b7280",
                      }}>
                        {sc.persona_confidence}%
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-muted)", fontSize: 12 }}>{formatDate(sc.computed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
