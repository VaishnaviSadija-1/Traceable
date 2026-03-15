export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getEmails, getEmailStats } from "@/lib/dashboard-queries";
import Pagination from "../components/Pagination";
import Badge from "../components/Badge";
import MetricCard from "../components/MetricCard";
import TestEmailButton from "./TestEmailButton";
import TriggerDigestButton from "./TriggerDigestButton";

interface Props {
  searchParams: Promise<{ page?: string; type?: string }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const typeVariant = (type: string) => {
  switch (type) {
    case "alert":
      return "danger" as const;
    case "daily_digest":
      return "info" as const;
    case "test":
      return "neutral" as const;
    case "account_intelligence":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
};

const typeLabel = (type: string) => {
  switch (type) {
    case "daily_digest":
      return "Daily Digest";
    case "account_intelligence":
      return "AI Summary";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

export default async function EmailsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const type = params.type ?? "all";

  const [{ data: emails, totalCount }, stats] = await Promise.all([
    getEmails({ page, type }),
    getEmailStats(),
  ]);

  const pageSize = 20;

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--color-tertiary)",
          }}
        >
          Emails
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <TestEmailButton />
          <TriggerDigestButton />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard label="Total Sent" value={stats.total} icon="✉" />
        <MetricCard label="Sent Today" value={stats.today} icon="●" />
        <MetricCard label="Alert Emails" value={stats.alerts} icon="△" />
        <MetricCard label="Digests" value={stats.digests} icon="◎" />
      </div>

      {/* Filter */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {["all", "alert", "daily_digest", "account_intelligence", "test"].map(
          (t) => (
            <a
              key={t}
              href={`/dashboard/emails?type=${t}`}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: type === t ? 600 : 400,
                borderRadius: 6,
                background:
                  type === t
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                color: type === t ? "#fff" : "var(--color-text-muted)",
                border: `1px solid ${
                  type === t
                    ? "var(--color-primary)"
                    : "var(--color-border)"
                }`,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              {t === "all"
                ? "All"
                : t === "daily_digest"
                ? "Digests"
                : t === "account_intelligence"
                ? "AI Summary"
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </a>
          )
        )}
      </div>

      {/* Table */}
      <div style={cardStyle}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-background)",
              }}
            >
              {["Type", "Subject", "Recipient", "Company", "Status", "Sent"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 16px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {emails.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No emails sent yet
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr
                  key={email.id}
                  style={{
                    borderBottom: "1px solid var(--color-border-light)",
                  }}
                >
                  <td style={{ padding: "10px 16px" }}>
                    <Badge
                      label={typeLabel(email.type)}
                      variant={typeVariant(email.type)}
                    />
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "var(--color-text)",
                      fontWeight: 500,
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {email.subject}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {email.recipient}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {email.companies?.name ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Badge
                      label={email.status}
                      variant={
                        email.status === "sent" ? "success" : "danger"
                      }
                    />
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "var(--color-text-muted)",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(email.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > pageSize && (
        <Suspense>
          <Pagination totalCount={totalCount} pageSize={pageSize} />
        </Suspense>
      )}
    </div>
  );
}
