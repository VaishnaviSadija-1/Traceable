import Badge from "./Badge";

interface PageVisitItem {
  page_url: string;
  page_category: string;
  entered_at?: string;
  duration_seconds?: number;
}

interface PageJourneyProps {
  pages: PageVisitItem[];
}

const categoryVariant = (cat: string) => {
  switch (cat) {
    case "pricing":
      return "danger" as const;
    case "sales-agent":
      return "warning" as const;
    case "case-studies":
      return "info" as const;
    default:
      return "neutral" as const;
  }
};

export default function PageJourney({ pages }: PageJourneyProps) {
  if (!pages?.length) return <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>No pages tracked</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {pages.map((page, i) => (
        <div key={i} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: 20 }}>
          {/* Timeline line */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i === 0 ? "var(--color-primary)" : "var(--color-border)",
                border: `2px solid ${i === 0 ? "var(--color-primary)" : "var(--color-border)"}`,
                zIndex: 1,
              }}
            />
            {i < pages.length - 1 && (
              <div style={{ width: 2, flex: 1, background: "var(--color-border-light)" }} />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)", wordBreak: "break-all" }}>
                {page.page_url}
              </span>
              <Badge label={page.page_category} variant={categoryVariant(page.page_category)} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {page.duration_seconds != null && (
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {page.duration_seconds}s
                </span>
              )}
              {page.entered_at && (
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {new Date(page.entered_at).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
