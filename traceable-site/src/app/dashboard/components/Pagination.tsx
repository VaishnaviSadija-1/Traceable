"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface PaginationProps {
  totalCount: number;
  pageSize: number;
}

export default function Pagination({ totalCount, pageSize }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 16,
        marginTop: 16,
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
        {totalCount.toLocaleString()} total &middot; Page {currentPage} of {totalPages}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 500,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            background: currentPage <= 1 ? "var(--color-background)" : "var(--color-surface)",
            color: currentPage <= 1 ? "var(--color-text-muted)" : "var(--color-text)",
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            opacity: currentPage <= 1 ? 0.5 : 1,
          }}
        >
          Previous
        </button>
        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 500,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            background: currentPage >= totalPages ? "var(--color-background)" : "var(--color-surface)",
            color: currentPage >= totalPages ? "var(--color-text-muted)" : "var(--color-text)",
            cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
            opacity: currentPage >= totalPages ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
