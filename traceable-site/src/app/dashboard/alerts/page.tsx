export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getAlerts } from "@/lib/dashboard-queries";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import Badge from "../components/Badge";
import ScoreBadge from "../components/ScoreBadge";
import CompanyAvatar from "../components/CompanyAvatar";
import EmptyState from "../components/EmptyState";

const PAGE_SIZE = 20;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "sent": return "success" as const;
    case "pending": return "warning" as const;
    case "failed": return "danger" as const;
    default: return "neutral" as const;
  }
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function AlertsTable({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const { data: alerts, totalCount } = await getAlerts({
    page,
    pageSize: PAGE_SIZE,
    status: params.status,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  if (alerts.length === 0) {
    return <EmptyState message="No alerts found" icon="△" />;
  }

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["Company", "Intent", "Lead Score", "Status", "Slack", "Email", "Time"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => {
              const company = a.companies as Record<string, unknown> | null;
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CompanyAvatar name={(company?.name as string) ?? null} size={28} />
                      <span style={{ fontWeight: 500, color: "var(--color-text)" }}>
                        {(company?.name as string) ?? "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <ScoreBadge score={a.score} />
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>
                    {a.lead_score ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <Badge label={a.status} variant={statusVariant(a.status)} />
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 16 }}>
                    {a.slack_sent ? "✓" : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 16 }}>
                    {a.email_sent ? "✓" : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {timeAgo(a.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination totalCount={totalCount} pageSize={PAGE_SIZE} />
    </>
  );
}

export default async function AlertsPage(props: Props) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-tertiary)", marginBottom: 24 }}>
        Alerts
      </h1>

      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading...</div>}>
        <FilterBar
          searchPlaceholder="Search..."
          filters={[
            {
              key: "status",
              label: "All statuses",
              options: [
                { label: "Sent", value: "sent" },
                { label: "Pending", value: "pending" },
                { label: "Suppressed", value: "suppressed" },
                { label: "Failed", value: "failed" },
              ],
            },
          ]}
        />
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden",
          }}
        >
          <AlertsTable searchParams={props.searchParams} />
        </div>
      </Suspense>
    </div>
  );
}
