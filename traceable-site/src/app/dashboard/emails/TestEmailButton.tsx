"use client";

import { useState } from "react";

export default function TestEmailButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleTest() {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/v1/internal/emails/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (data.ok) {
        setStatus("Test email sent successfully");
      } else {
        setStatus(`Failed: ${data.error}`);
      }
    } catch {
      setStatus("Failed to send test email");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 5000);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-secondary)",
          background: "var(--color-surface)",
          border: "1.5px solid var(--color-border)",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Sending..." : "Send Test Email"}
      </button>
      {status && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 6,
            whiteSpace: "nowrap",
            zIndex: 10,
            background: status.includes("success") ? "#f0fdf4" : "#fef2f2",
            color: status.includes("success") ? "#15803d" : "#dc2626",
            border: `1px solid ${status.includes("success") ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
