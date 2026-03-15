"use client";

import { useState } from "react";

interface LookupResult {
  ok: boolean;
  resolved: boolean;
  company_name?: string | null;
  org?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  hostname?: string | null;
  message?: string;
  error?: string;
}

export default function IPLookupTest() {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleLookup() {
    if (!ip.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/v1/internal/test/ip-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: ip.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, resolved: false, error: "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid var(--color-border-light)",
    fontSize: 13,
  };

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-tertiary)",
            margin: 0,
          }}
        >
          IP Lookup Test
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-muted)",
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          Verify that an IP address resolves to the correct company. This is a
          read-only lookup — it will not create sessions, generate intent
          scores, or trigger any emails.
        </p>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="Enter an IP address (e.g. 17.253.144.10)"
            style={{
              flex: 1,
              padding: "8px 14px",
              fontSize: 14,
              border: "1.5px solid var(--color-border)",
              borderRadius: 6,
              outline: "none",
              color: "var(--color-text)",
              background: "var(--color-background)",
            }}
          />
          <button
            onClick={handleLookup}
            disabled={loading || !ip.trim()}
            style={{
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background:
                loading || !ip.trim() ? "#ccc" : "var(--color-primary)",
              border: "none",
              borderRadius: 6,
              cursor: loading || !ip.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Looking up..." : "Lookup"}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 16 }}>
            {result.error ? (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: 6,
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                }}
              >
                {result.error}
              </div>
            ) : !result.resolved ? (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: 6,
                  background: "#fffbeb",
                  color: "#b45309",
                  border: "1px solid #fde68a",
                }}
              >
                {result.message}
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <div style={rowStyle}>
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>
                    Company
                  </span>
                  <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
                    {result.company_name ?? "—"}
                  </span>
                </div>
                <div style={rowStyle}>
                  <span style={{ color: "var(--color-text-muted)" }}>Org</span>
                  <span style={{ color: "var(--color-text)" }}>
                    {result.org ?? "—"}
                  </span>
                </div>
                <div style={rowStyle}>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Location
                  </span>
                  <span style={{ color: "var(--color-text)" }}>
                    {[result.city, result.region, result.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </span>
                </div>
                <div style={{ ...rowStyle, borderBottom: "none" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    Hostname
                  </span>
                  <span style={{ color: "var(--color-text)" }}>
                    {result.hostname ?? "—"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
