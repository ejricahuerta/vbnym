"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { MAGIC_LINK_TTL_MS } from "@/lib/magic-auth-cookies";
import { requestAdminMagicLink } from "@/server/actions/request-admin-magic-link";

const MAGIC_LINK_TTL_MIN = Math.round(MAGIC_LINK_TTL_MS / 60000);

export function AdminMagicLinkForm() {
  const searchParams = useSearchParams();
  const recover = searchParams.get("recover");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(): void {
    setMessage(null);
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    startTransition(async () => {
      const res = await requestAdminMagicLink(fd);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage("Check your email for a sign-in link.");
    });
  }

  return (
    <div>
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
          <label className="label" htmlFor="admin-login-email" style={{ display: "block", marginBottom: 8 }}>
            Email
          </label>
          <input
            id="admin-login-email"
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
            aria-describedby="admin-login-hint"
          />
          <p id="admin-login-hint" className="mono" style={{ fontSize: 11, marginTop: 10, marginBottom: 0, color: "var(--ink-3)", lineHeight: 1.45 }}>
            One-time link, expires in {MAGIC_LINK_TTL_MIN} min.
          </p>
        </div>
        <button type="submit" className="btn accent motion-press" disabled={pending || !email.includes("@")} aria-busy={pending} style={{ width: "100%", marginTop: 4 }}>
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
