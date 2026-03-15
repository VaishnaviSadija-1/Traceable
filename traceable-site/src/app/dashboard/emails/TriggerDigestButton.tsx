"use client";

import { useState } from "react";

export default function TriggerDigestButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleTrigger() {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/v1/internal/alerts/daily-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: 24 }),
      });

      const data = await res.json();

      if (data.email_sent) {
        setStatus(`Digest sent (${data.entries_count} entries)`);
      } else if (data.email_error) {
        setStatus(`Failed: ${data.email_error}`);
      } else {
        setStatus("Digest generated but email not sent");
      }
    } catch {
      setStatus("Failed to trigger digest");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 5000);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleTrigger}
        disabled={loading}
        style={{
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 600,
          color: "#ffffff",
          background: loading ? "#ccc" : "var(--color-primary)",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {loading ? "Sending..." : "Send Digest Now"}
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
            background: status.includes("sent") ? "#f0fdf4" : "#fef2f2",
            color: status.includes("sent") ? "#15803d" : "#dc2626",
            border: `1px solid ${status.includes("sent") ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}
