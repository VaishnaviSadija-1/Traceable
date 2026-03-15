"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getVisitorId(): string {
  const key = "trc_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getSessionId(): string | null {
  return sessionStorage.getItem("trc_session_id");
}
function setSessionId(id: string) {
  sessionStorage.setItem("trc_session_id", id);
}

function sendPageLeave(sessionId: string, pageUrl: string, enteredAt: number) {
  const duration_seconds = Math.round((Date.now() - enteredAt) / 1000);
  // Use sendBeacon so it fires even when the tab is closing
  const payload = JSON.stringify({
    session_id: sessionId,
    event_type: "page_leave",
    page_url: pageUrl,
    metadata: { duration_seconds },
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/v1/sessions/events", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/v1/sessions/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

export default function SessionTracker() {
  const pathname = usePathname();
  const sessionStarted = useRef(false);
  const prevPage = useRef<{ url: string; enteredAt: number } | null>(null);

  // Start session on first load
  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;

    async function startSession() {
      try {
        const res = await fetch("/api/v1/sessions/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitor_id: getVisitorId(),
            landing_url: window.location.href,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.session_id);
        }
      } catch {
        // Silent fail — tracking must never break the page
      }
    }

    startSession();
  }, []);

  // On every route change: record leave time for previous page, then track new page view
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    // Fire page_leave for the page we're navigating away from
    if (prevPage.current) {
      sendPageLeave(sessionId, prevPage.current.url, prevPage.current.enteredAt);
    }

    const enteredAt = Date.now();
    const currentUrl = window.location.href;
    prevPage.current = { url: currentUrl, enteredAt };

    // Track page view for the new page
    fetch("/api/v1/sessions/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        event_type: "page_view",
        page_url: currentUrl,
      }),
    }).catch(() => {});

    // Fire page_leave when the tab is closed / refreshed
    function handleUnload() {
      if (prevPage.current && sessionId) {
        sendPageLeave(sessionId, prevPage.current.url, prevPage.current.enteredAt);
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [pathname]);

  return null;
}
