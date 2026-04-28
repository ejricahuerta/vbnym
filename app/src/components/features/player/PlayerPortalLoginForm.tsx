"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { MAGIC_LINK_TTL_MS } from "@/lib/magic-auth-cookies";
import { requestPlayerMagicLink } from "@/server/actions/request-player-magic-link";

const MAGIC_LINK_TTL_MIN = Math.round(MAGIC_LINK_TTL_MS / 60000);

export function PlayerPortalLoginForm() {
  const searchParams = useSearchParams();
  const recover = searchParams.get("recover");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [emailFieldMounted, setEmailFieldMounted] = useState(false);

  useEffect(() => {
    setEmailFieldMounted(true);
  }, []);

  function submit(): void {
    setMessage(null);
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    startTransition(async () => {
      const res = await requestPlayerMagicLink(fd);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      if (res.emailed) {
        setMessage("Check your email for a sign-in link.");
      } else {
        setMessage(
          "If that email has an upcoming signup on 6IX BACK, we sent a link. Otherwise you won’t receive mail → double-check the address."
        );
      }
    });
  }

  return (
    <div>
      {recover === "ok" ? (
        <p
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            border: "2px solid var(--ink)",
            borderRadius: 8,
            background: "var(--accent)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          You&apos;re signed in. Your games are listed below.
        </p>
      ) : null}
      {recover === "invalid" ? (
        <p
          role="alert"
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            border: "2px solid var(--ink)",
            borderRadius: 8,
            background: "rgba(220,38,38,.15)",
            fontSize: 14,
          }}
        >
          That sign-in link is invalid or expired. Request a new one below.
        </p>
      ) : null}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!pending && email.includes("@")) submit();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div>
          <label className="label" htmlFor="player-login-email" style={{ display: "block", marginBottom: 8 }}>
            Email
          </label>
          {emailFieldMounted ? (
            <input
              id="player-login-email"
              name="email"
              className="input"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
              aria-describedby="player-login-hint"
            />
          ) : (
            <div className="input" style={{ width: "100%", boxSizing: "border-box" }} aria-hidden />
          )}
          <p id="player-login-hint" className="mono" style={{ fontSize: 11, marginTop: 10, marginBottom: 0, color: "var(--ink-3)", lineHeight: 1.45 }}>
            No password → we email a one-time link (expires in {MAGIC_LINK_TTL_MIN} min).
          </p>
        </div>
        <button type="submit" className="btn accent" disabled={pending || !email.includes("@")} aria-busy={pending} style={{ width: "100%", marginTop: 4 }}>
          {pending ? "Sending…" : "Email sign-in link"}
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true" style={{ marginTop: 14 }}>
        {message ? (
          <p style={{ margin: 0, fontSize: 14 }} role={message.startsWith("Check") ? "status" : "alert"}>
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
