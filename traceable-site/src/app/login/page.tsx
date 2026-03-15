"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      const redirectTo = searchParams.get("from") || "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Logo / Brand */}
        <div style={styles.brandSection}>
          <div style={styles.logoMark}>T</div>
          <h1 style={styles.brandName}>Traceable</h1>
          <p style={styles.subtitle}>Admin Dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label htmlFor="username" style={styles.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter your username"
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #FEFBF9 0%, #f0ece8 100%)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e8e4e0",
    boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
    padding: "40px 36px",
  },
  brandSection: {
    textAlign: "center" as const,
    marginBottom: 32,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: "#FF725C",
    color: "#ffffff",
    fontSize: 24,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#093555",
    letterSpacing: "-0.02em",
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#093555",
  },
  input: {
    padding: "10px 14px",
    fontSize: 14,
    border: "1.5px solid #e8e4e0",
    borderRadius: 8,
    outline: "none",
    transition: "border-color 0.15s ease",
    color: "#1a1a1a",
    background: "#FEFBF9",
  },
  button: {
    marginTop: 4,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 600,
    color: "#ffffff",
    background: "#FF725C",
    border: "none",
    borderRadius: 8,
    transition: "background 0.15s ease, transform 0.1s ease",
  },
  error: {
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: 13,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #fecaca",
  },
};
