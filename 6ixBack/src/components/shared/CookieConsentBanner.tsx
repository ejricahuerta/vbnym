"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sixback_cookie_consent_v1";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setMounted(true);
        setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
      } catch {
        setMounted(true);
        setVisible(true);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  function dismiss(): void {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        padding: "14px 16px 18px",
        background: "var(--paper)",
        borderTop: "2px solid var(--ink)",
        boxShadow: "0 -8px 32px rgba(17,17,20,.12)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            flex: "1 1 280px",
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--ink-2)",
          }}
        >
          We use cookies and similar tech to keep you signed in, remember preferences, and improve the site.
          {" "}
          <Link href="/privacy" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Privacy Policy
          </Link>
          .
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button
            type="button"
            className="btn ghost sm"
            aria-label="Close cookie notice"
            onClick={dismiss}
            style={{ minWidth: 36, paddingLeft: 10, paddingRight: 10 }}
          >
            <span aria-hidden style={{ fontSize: 18, lineHeight: 1, fontWeight: 700 }}>
              ×
            </span>
          </button>
          <button type="button" className="btn accent sm" onClick={dismiss}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
