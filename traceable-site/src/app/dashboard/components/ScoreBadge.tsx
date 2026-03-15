interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const bg =
    score >= 70
      ? "rgba(255,114,92,0.15)"
      : score >= 40
      ? "rgba(245,158,11,0.12)"
      : "rgba(107,114,128,0.1)";
  const color =
    score >= 70 ? "#FF725C" : score >= 40 ? "#d97706" : "#6b7280";

  const sizes = {
    sm: { fontSize: 12, padding: "3px 10px" },
    md: { fontSize: 14, padding: "4px 12px" },
    lg: { fontSize: 24, padding: "8px 16px" },
  };

  const s = sizes[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontWeight: 700,
        borderRadius: 999,
        background: bg,
        color,
        fontSize: s.fontSize,
        padding: s.padding,
        whiteSpace: "nowrap",
      }}
    >
      {score}
    </span>
  );
}
