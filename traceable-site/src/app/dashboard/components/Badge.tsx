type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: "rgba(16,185,129,0.12)", color: "#059669" },
  warning: { bg: "rgba(245,158,11,0.12)", color: "#d97706" },
  danger: { bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
  neutral: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  info: { bg: "rgba(9,132,134,0.1)", color: "#098486" },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = "neutral" }: BadgeProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 999,
        background: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
