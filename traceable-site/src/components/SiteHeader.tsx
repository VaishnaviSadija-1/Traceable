"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Sales Agent", href: "/sales-agent" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <header
        className="site-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: "background 0.2s ease, box-shadow 0.2s ease, backdrop-filter 0.2s ease",
          background: scrolled ? "rgba(254,251,249,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 1px 0 rgba(0,0,0,0.07)" : "none",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "68px",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--color-primary)",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "19px",
                fontWeight: "700",
                color: "var(--color-tertiary)",
                letterSpacing: "-0.03em",
              }}
            >
              Traceable
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            aria-label="Primary navigation"
            className="desktop-nav"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--color-tertiary)",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(9,53,85,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTA + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="#demo" className="btn-primary" style={{ fontSize: "14px", padding: "10px 20px" }}
              aria-label="Book a demo"
            >
              Book a Demo
            </Link>

            {/* Hamburger — visible only on mobile */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              style={{
                display: "none",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
                width: "36px",
                height: "36px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "var(--radius-sm)",
              }}
              className="hamburger-btn"
            >
              <span
                style={{
                  display: "block",
                  width: "20px",
                  height: "2px",
                  background: "var(--color-tertiary)",
                  borderRadius: "2px",
                  transformOrigin: "center",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                  transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none",
                }}
              />
              <span
                style={{
                  display: "block",
                  width: "20px",
                  height: "2px",
                  background: "var(--color-tertiary)",
                  borderRadius: "2px",
                  transition: "opacity 0.2s ease",
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: "block",
                  width: "20px",
                  height: "2px",
                  background: "var(--color-tertiary)",
                  borderRadius: "2px",
                  transformOrigin: "center",
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                  transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: menuOpen ? "320px" : "0",
            transition: "max-height 0.3s ease",
            background: "var(--color-background)",
            borderTop: menuOpen ? "1px solid var(--color-border)" : "none",
          }}
          className="mobile-menu"
        >
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px 24px 24px",
              gap: "4px",
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: "16px",
                  fontWeight: "500",
                  color: "var(--color-tertiary)",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--color-border-light)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#demo"
              className="btn-primary"
              onClick={() => setMenuOpen(false)}
              style={{ marginTop: "16px", textAlign: "center", justifyContent: "center" }}
            >
              Book a Demo
            </Link>
          </nav>
        </div>
      </header>

      {/* Responsive styles injected via style tag */}
      <style>{`
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
