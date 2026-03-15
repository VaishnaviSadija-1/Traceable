import type { Metadata } from "next";
import DashboardSidebar from "./components/DashboardSidebar";
import LogoutButton from "./components/LogoutButton";

export const metadata: Metadata = {
  title: "Dashboard — Traceable",
  description: "Traceable admin dashboard",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar />
      <div
        style={{
          flex: 1,
          marginLeft: 240,
          background: "var(--color-background)",
          minHeight: "100vh",
        }}
        className="dashboard-main"
      >
        {/* Topbar */}
        <header
          style={{
            padding: "16px 32px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Visitor Intelligence Dashboard
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <LogoutButton />
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: 32 }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
