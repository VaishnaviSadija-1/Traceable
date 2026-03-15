export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { getCompanies } from "@/lib/dashboard-queries";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import CompanyAvatar from "../components/CompanyAvatar";
import Badge from "../components/Badge";
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

const confidenceVariant = (c: string) => {
  switch (c) {
    case "high": return "success" as const;
    case "medium": return "warning" as const;
    default: return "neutral" as const;
  }
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function CompaniesTable({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const { data: companies, totalCount } = await getCompanies({
    page,
    pageSize: PAGE_SIZE,
    sort: params.sort ?? "newest",
    search: params.search,
    industry: params.industry,
  });

  if (companies.length === 0) {
    return <EmptyState message="No companies found" icon="⏣" />;
  }

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["Company", "Domain", "Industry", "Employees", "AI Summary", "Confidence", "Last Seen"].map((h) => (
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
            {companies.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                <td style={{ padding: "10px 12px" }}>
                  <Link
                    href={`/dashboard/companies/${c.id}`}
                    style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
                  >
                    <CompanyAvatar name={c.name} size={28} />
                    <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{c.name ?? "—"}</span>
                  </Link>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>{c.domain ?? "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>{c.industry ?? "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>
                  {c.employee_count != null ? c.employee_count.toLocaleString() : "—"}
                </td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", maxWidth: 320, fontSize: 12, lineHeight: 1.4 }}>
                  {c.ai_summary ? c.ai_summary : <span style={{ color: "var(--color-border)", fontStyle: "italic" }}>Not generated</span>}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <Badge label={c.confidence} variant={confidenceVariant(c.confidence)} />
                </td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                  {timeAgo(c.last_seen_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination totalCount={totalCount} pageSize={PAGE_SIZE} />
    </>
  );
}

export default async function CompaniesPage(props: Props) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-tertiary)", marginBottom: 24 }}>
        Companies
      </h1>

      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading...</div>}>
        <FilterBar
          searchPlaceholder="Search by name or domain..."
          sortOptions={[
            { label: "Newest first", value: "newest" },
            { label: "Oldest first", value: "oldest" },
            { label: "Last seen", value: "last_seen" },
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
          <CompaniesTable searchParams={props.searchParams} />
        </div>
      </Suspense>
    </div>
  );
}
