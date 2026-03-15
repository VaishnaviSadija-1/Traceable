export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { getSessions } from "@/lib/dashboard-queries";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
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

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function SessionsTable({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const { data: sessions, totalCount } = await getSessions({
    page,
    pageSize: PAGE_SIZE,
    sort: params.sort ?? "newest",
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  if (sessions.length === 0) {
    return <EmptyState message="No sessions found" icon="⟐" />;
  }

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["Company", "Visitor", "Landing Page", "Pages", "Score", "Lead", "Stage", "Persona", "Confidence", "Time"].map((h) => (
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
            {sessions.map((s) => {
              const company = s.companies as Record<string, unknown> | null;
              const scoresArr = Array.isArray(s.scores) ? (s.scores as unknown as Array<Record<string, unknown>>) : [];
              const topScore = scoresArr.length > 0 ? (scoresArr[0].score as number) : null;
              const leadScore = scoresArr.length > 0 ? (scoresArr[0].lead_score as number) : null;
              const buyerStage = scoresArr.length > 0 ? (scoresArr[0].buyer_stage as string) : null;
              const persona = scoresArr.length > 0 ? (scoresArr[0].persona as string) : null;
              const personaConfidence = scoresArr.length > 0 ? (scoresArr[0].persona_confidence as number | null) : null;
              const pages = s.pages as unknown[];

              const stageColor = (stage: string | null) => {
                switch (stage) {
                  case "decision": return "#dc2626";
                  case "consideration": return "#ea580c";
                  case "awareness": return "#ca8a04";
                  default: return "var(--color-text-muted)";
                }
              };

              return (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: "1px solid var(--color-border-light)",
                    cursor: "pointer",
                  }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <Link
                      href={`/dashboard/sessions/${s.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
                    >
                      <CompanyAvatar name={(company?.name as string) ?? null} size={28} />
                      <span style={{ fontWeight: 500, color: "var(--color-text)" }}>
                        {(company?.name as string) ?? "Unknown"}
                      </span>
                    </Link>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", fontFamily: "monospace", fontSize: 11 }}>
                    {s.visitor_id?.slice(0, 12) ?? s.ip ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.landing_url}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>
                    {pages?.length ?? 0}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {topScore != null ? <ScoreBadge score={topScore} /> : <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)" }}>
                    {leadScore != null ? leadScore : "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {buyerStage && buyerStage !== "unknown" ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: stageColor(buyerStage), textTransform: "capitalize" }}>
                        {buyerStage}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                    {persona ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {personaConfidence != null ? (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: personaConfidence >= 70 ? "rgba(22,163,74,0.1)" : personaConfidence >= 50 ? "rgba(234,88,12,0.1)" : "rgba(107,114,128,0.1)",
                        color: personaConfidence >= 70 ? "#16a34a" : personaConfidence >= 50 ? "#ea580c" : "#6b7280",
                      }}>
                        {personaConfidence}%
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {timeAgo(s.created_at)}
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

export default async function SessionsPage(props: Props) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-tertiary)", marginBottom: 24 }}>
        Sessions
      </h1>

      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>Loading...</div>}>
        <FilterBar
          searchPlaceholder="Search by visitor ID, IP, or URL..."
          sortOptions={[
            { label: "Newest first", value: "newest" },
            { label: "Oldest first", value: "oldest" },
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
          <SessionsTable searchParams={props.searchParams} />
        </div>
      </Suspense>
    </div>
  );
}
