interface EmptyStateProps {
  icon?: string;
  message: string;
}

export default function EmptyState({ icon = "∅", message }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        color: "var(--color-text-muted)",
      }}
    >
      <span style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>{icon}</span>
      <p style={{ fontSize: 15, color: "var(--color-text-muted)" }}>{message}</p>
    </div>
  );
}
