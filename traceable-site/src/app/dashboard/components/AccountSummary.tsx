"use client";

import { useState } from "react";

interface Props {
  companyId: string;
  companyName: string;
  existingSummary: string | null;
  generatedAt: string | null;
}

export default function AccountSummary({
  companyId,
  companyName,
  existingSummary,
  generatedAt,
}: Props) {
  const [summary, setSummary] = useState(existingSummary);
  const [summaryDate, setSummaryDate] = useState(generatedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setEmailStatus(null);

    try {
      const res = await fetch("/api/v1/internal/companies/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate summary");
        setLoading(false);
        return;
      }

      setSummary(data.summary);
      setSummaryDate(new Date().toISOString());

      if (data.email_sent) {
        setEmailStatus("Summary emailed to sales team");
      } else if (data.email_error) {
        setEmailStatus(`Email failed: ${data.email_error}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 20,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
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
          AI Account Intelligence
        </h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "6px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#ffffff",
            background: loading ? "#ccc" : "var(--color-primary)",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s ease",
          }}
        >
          {loading
            ? "Generating..."
            : summary
            ? "Regenerate"
            : "Generate Summary"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#dc2626",
            fontSize: 13,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #fecaca",
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {emailStatus && (
        <div
          style={{
            background: emailStatus.includes("failed")
              ? "#fffbeb"
              : "#f0fdf4",
            color: emailStatus.includes("failed") ? "#b45309" : "#15803d",
            fontSize: 13,
            padding: "10px 14px",
            borderRadius: 8,
            border: `1px solid ${
              emailStatus.includes("failed") ? "#fde68a" : "#bbf7d0"
            }`,
            marginBottom: 12,
          }}
        >
          {emailStatus}
        </div>
      )}

      {summary ? (
        <div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            {summary}
          </p>
          {summaryDate && (
            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                marginTop: 12,
              }}
            >
              Generated{" "}
              {new Date(summaryDate).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      ) : (
        !loading && (
          <p
            style={{
              fontSize: 14,
              color: "var(--color-text-muted)",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            Click &quot;Generate Summary&quot; to create an AI-powered
            intelligence brief about {companyName}.
          </p>
        )
      )}

      {loading && (
        <p
          style={{
            fontSize: 14,
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          Researching {companyName} and analyzing browsing behavior...
        </p>
      )}
    </div>
  );
}
