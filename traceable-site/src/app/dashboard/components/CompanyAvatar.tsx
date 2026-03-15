interface CompanyAvatarProps {
  name: string | null;
  size?: number;
}

export default function CompanyAvatar({ name, size = 36 }: CompanyAvatarProps) {
  const letter = (name ?? "?")[0].toUpperCase();
  // Deterministic hue from name
  let hash = 0;
  for (const char of name ?? "X") {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-sm)",
        background: `hsl(${hue}, 55%, 88%)`,
        color: `hsl(${hue}, 45%, 35%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.45,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}
