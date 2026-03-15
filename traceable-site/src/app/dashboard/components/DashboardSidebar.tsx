"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "◎" },
  { href: "/dashboard/sessions", label: "Sessions", icon: "⟐" },
  { href: "/dashboard/companies", label: "Companies", icon: "⏣" },
  { href: "/dashboard/research", label: "Research", icon: "◉" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "△" },
  { href: "/dashboard/emails", label: "Emails", icon: "✉" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: "none",
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1001,
          background: "var(--color-tertiary)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius-sm)",
          width: 40,
          height: 40,
          fontSize: 20,
          cursor: "pointer",
        }}
        className="sidebar-hamburger"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 999,
          }}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          minHeight: "100vh",
          background: "var(--color-tertiary)",
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          transition: "transform 0.2s ease",
        }}
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 24px 24px",
            textDecoration: "none",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--color-primary)",
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Traceable
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  color: active ? "#fff" : "rgba(255,255,255,0.6)",
                  background: active ? "rgba(255,114,92,0.2)" : "transparent",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: "auto", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Admin Dashboard</span>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-hamburger { display: flex !important; align-items: center; justify-content: center; }
          .sidebar { transform: translateX(-100%); }
          .sidebar.sidebar-open { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
