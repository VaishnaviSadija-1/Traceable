export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSessionDetail } from "@/lib/dashboard-queries";
import Badge from "../../components/Badge";
import ScoreBadge from "../../components/ScoreBadge";
import PageJourney from "../../components/PageJourney";

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

const stageVariant = (stage: string) => {
  switch (stage) {
    case "decision": return "danger" as const;
    case "consideration": return "warning" as const;
    case "awareness": return "info" as const;
    default: return "neutral" as const;
  }
};

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getSessionDetail(id);

  if (!result) {
    return (
      <div>
        <Link href="/dashboard/sessions" style={{ fontSize: 13, color: "var(--color-link)" }}>← Back to Sessions</Link>
        <p style={{ marginTop: 24, color: "var(--color-text-muted)" }}>Session not found.</p>
      </div>
    );
  }

  const { session, events } = result;
  const identity = session.identities;
  const scores = session.scores as Array<Record<string, unknown>> | null;
  const score = scores?.[0];
  const company = session.companies as Record<string, unknown> | null;
  const pages = (session.pages ?? []) as Array<{ page_url: string; page_category: string; entered_at?: string; duration_seconds?: number }>;

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
    wordBreak: "break-all",
  };

  return (
    <div>
      <Link href="/dashboard/sessions" style={{ fontSize: 13, color: "var(--color-link)", display: "inline-block", marginBottom: 20 }}>
        ← Back to Sessions
      </Link>

      {/* Header Card */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          <div>
            <div style={labelStyle}>Visitor ID</div>
            <div style={{ ...valStyle, fontFamily: "monospace", fontSize: 12 }}>{session.visitor_id ?? "—"}</div>
          </div>
          <div>
            <div style={labelStyle}>IP Address</div>
            <div style={valStyle}>{session.ip ?? "—"}</div>
          </div>
          <div>
            <div style={labelStyle}>Referrer</div>
            <div style={valStyle}>{session.referrer || "Direct"}</div>
          </div>
          <div>
            <div style={labelStyle}>Created</div>
            <div style={valStyle}>{formatDate(session.created_at)}</div>
          </div>
          <div>
            <div style={labelStyle}>Landing URL</div>
            <div style={valStyle}>{session.landing_url}</div>
          </div>
          <div>
            <div style={labelStyle}>User Agent</div>
            <div style={{ ...valStyle, fontSize: 11, color: "var(--color-text-muted)" }}>{session.user_agent ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Two Column: Journey + Identity/Score */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Page Journey */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>Page Journey</h2>
          <PageJourney pages={pages} />
        </div>

        {/* Identity & Score */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Identity */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>Identity</h2>
            {identity ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {identity.full_name && <div><span style={labelStyle}>Name</span><div style={valStyle}>{identity.full_name}</div></div>}
                {identity.email && <div><span style={labelStyle}>Email</span><div style={valStyle}>{identity.email}</div></div>}
                {identity.title && <div><span style={labelStyle}>Title</span><div style={valStyle}>{identity.title}</div></div>}
                {identity.linkedin_url && <div><span style={labelStyle}>LinkedIn</span><div><a href={identity.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14 }}>{identity.linkedin_url}</a></div></div>}
                {identity.company_name && <div><span style={labelStyle}>Company</span><div style={valStyle}>{identity.company_name}</div></div>}
                <div><span style={labelStyle}>Source</span><div><Badge label={identity.source} variant="info" /></div></div>
              </div>
            ) : company ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><span style={labelStyle}>Company</span><div style={valStyle}>{(company.name as string) ?? "—"}</div></div>
                <div><span style={labelStyle}>Domain</span><div style={valStyle}>{(company.domain as string) ?? "—"}</div></div>
                <div><span style={labelStyle}>Source</span><div><Badge label="IP resolution" variant="neutral" /></div></div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>Not yet identified</p>
            )}
          </div>

          {/* Score */}
          {score && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>Score</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <ScoreBadge score={score.score as number} size="lg" />
                <div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Intent Score</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><span style={labelStyle}>Fit Score</span><div style={valStyle}>{score.fit_score as number}</div></div>
                <div><span style={labelStyle}>Lead Score</span><div style={valStyle}>{score.lead_score as number}</div></div>
                <div><span style={labelStyle}>Buyer Stage</span><div><Badge label={score.buyer_stage as string} variant={stageVariant(score.buyer_stage as string)} /></div></div>
                <div><span style={labelStyle}>Repeat Visit</span><div style={valStyle}>{(score.repeat_visit as boolean) ? "Yes" : "No"}</div></div>
              </div>
            </div>
          )}

          {/* Persona */}
          {score && (score.persona as string) && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>Persona Inference</h2>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
                  {score.persona as string}
                </div>
                {(score.persona_confidence as number | null) != null && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: (score.persona_confidence as number) >= 70 ? "rgba(22,163,74,0.1)" : (score.persona_confidence as number) >= 50 ? "rgba(234,88,12,0.1)" : "rgba(107,114,128,0.1)",
                    color: (score.persona_confidence as number) >= 70 ? "#16a34a" : (score.persona_confidence as number) >= 50 ? "#ea580c" : "#6b7280",
                  }}>
                    Confidence: {score.persona_confidence as number}%
                  </span>
                )}
              </div>
              {Array.isArray(score.persona_signals) && (score.persona_signals as string[]).length > 0 && (
                <div>
                  <div style={labelStyle}>Signals</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {(score.persona_signals as string[]).map((signal, i) => (
                      <span
                        key={i}
                        style={{
                          padding: "3px 10px",
                          fontSize: 12,
                          borderRadius: "var(--radius-sm)",
                          background: "rgba(9,53,85,0.06)",
                          color: "var(--color-secondary)",
                        }}
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Events Timeline */}
      {events.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)", marginBottom: 16 }}>
            Events ({events.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {events.map((evt) => (
              <div
                key={evt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid var(--color-border-light)",
                  fontSize: 13,
                }}
              >
                <Badge
                  label={evt.event_type}
                  variant={evt.event_type === "page_view" ? "info" : evt.event_type === "form_submit" ? "success" : "neutral"}
                />
                <span style={{ color: "var(--color-text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {evt.page_url}
                </span>
                {evt.duration_seconds != null && (
                  <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{evt.duration_seconds}s</span>
                )}
                <span style={{ color: "var(--color-text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
