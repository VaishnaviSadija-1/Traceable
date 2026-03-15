export const dynamic = "force-dynamic";

import Link from "next/link";
import { getOverviewMetrics, getRecentHighIntentSessions, getEmailStats } from "@/lib/dashboard-queries";
import MetricCard from "./components/MetricCard";
import ScoreBadge from "./components/ScoreBadge";
import CompanyAvatar from "./components/CompanyAvatar";
import EmptyState from "./components/EmptyState";
import IPLookupTest from "./components/IPLookupTest";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function DashboardOverview() {
  const [metrics, recentSessions, emailStats] = await Promise.all([
    getOverviewMetrics(),
    getRecentHighIntentSessions(10),
    getEmailStats(),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-tertiary)", marginBottom: 24 }}>
        Overview
      </h1>

      {/* Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <MetricCard label="Active Sessions" value={metrics.activeSessions} icon="●" />
        <MetricCard label="Visitors Today" value={metrics.visitorsToday} icon="👤" />
        <MetricCard label="Companies Identified" value={metrics.companiesIdentified} icon="⏣" />
        <MetricCard label="Alerts Sent Today" value={metrics.alertsSentToday} icon="△" />
        <MetricCard label="Emails Sent Today" value={emailStats.today} icon="✉" />
      </div>

      {/* IP Lookup Test + Recent High-Intent Sessions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <IPLookupTest />
      </div>

      {/* Recent High-Intent Sessions */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-tertiary)" }}>
            Recent High-Intent Visitors
          </h2>
        </div>

        {recentSessions.length === 0 ? (
          <EmptyState message="No high-intent sessions yet" />
        ) : (
          <div>
            {recentSessions.map((item: Record<string, unknown>) => {
              const sessions = item.sessions as Record<string, unknown> | undefined;
              const companies = item.companies as Record<string, unknown> | undefined;
              const score = item.score as number;
              const buyerStage = item.buyer_stage as string;
              const sessionId = sessions?.id as string;

              return (
                <Link
                  key={item.id as string}
                  href={`/dashboard/sessions/${sessionId}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--color-border-light)",
                    textDecoration: "none",
                    transition: "background 0.1s ease",
                  }}
                >
                  <CompanyAvatar name={(companies?.name as string) ?? null} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>
                      {(companies?.name as string) ?? "Unknown Company"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(sessions?.landing_url as string) ?? "—"}
                    </div>
                  </div>
                  <ScoreBadge score={score} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--color-text-muted)",
                      textTransform: "capitalize",
                      minWidth: 80,
                      textAlign: "right",
                    }}
                  >
                    {buyerStage}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", minWidth: 60, textAlign: "right" }}>
                    {timeAgo(sessions?.created_at as string)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
