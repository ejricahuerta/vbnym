"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { DEFAULT_ORGANIZATION_ID, DEFAULT_ORGANIZATION_NAME } from "@/lib/organization-default";
import { submitHostAccessRequest } from "@/server/actions/submit-host-access-request";
import type { LiveGameSummaryForHostRequest } from "@/server/queries/games";
import type { OrganizationRow } from "@/types/domain";

function formatContextStart(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HostAccessRequestForm({
  organizations,
  gameSummary,
}: {
  organizations: OrganizationRow[];
  gameSummary: LiveGameSummaryForHostRequest | null;
}) {
  const searchParams = useSearchParams();
  const qpEmail = searchParams.get("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [organizationId, setOrganizationId] = useState(DEFAULT_ORGANIZATION_ID);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof qpEmail === "string" && qpEmail.includes("@")) {
      setEmail(qpEmail.trim().toLowerCase());
    }
  }, [qpEmail]);

  useEffect(() => {
    if (organizations.length === 0) return;
    const stillValid = organizations.some((o) => o.id === organizationId);
    if (!stillValid) {
      setOrganizationId(organizations[0]?.id ?? DEFAULT_ORGANIZATION_ID);
    }
  }, [organizations, organizationId]);

  function submit(): void {
    setStatus(null);
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    fd.set("name", name.trim());
    fd.set("message", message.trim());
    fd.set("organizationId", organizationId);
    if (gameSummary?.id) {
      fd.set("contextGameId", gameSummary.id);
    }
    startTransition(async () => {
      const res = await submitHostAccessRequest(fd);
      if (!res.ok) {
        setStatus(res.error);
        return;
      }
      if (res.data.alreadyHost) {
        setStatus("That email is already approved. You can use host sign-in.");
        return;
      }
      if (res.data.duplicate) {
        setStatus("We already have a pending request for that email.");
        return;
      }
      setStatus("Thanks. We will review your request.");
      setName("");
      setMessage("");
    });
  }

  const orgRaw = gameSummary?.organizations;
  const orgRow = orgRaw == null ? null : Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
  const presenterName = orgRow?.name?.trim() || DEFAULT_ORGANIZATION_NAME;
  const venueLine = gameSummary
    ? [gameSummary.venue_name, gameSummary.venue_area].filter(Boolean).join(", ")
    : "";

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!pending && email.includes("@") && name.trim().length > 0 && organizationId) submit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {gameSummary ? (
        <div className="card" style={{ padding: 14, border: "2px solid var(--ink)", marginBottom: 4 }}>
          <div className="label" style={{ marginBottom: 8 }}>
            Request context
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>
            <strong>Game:</strong> {gameSummary.title}
            <br />
            <strong>Schedule:</strong> {formatContextStart(gameSummary.starts_at)}
            <br />
            <strong>Venue:</strong> {venueLine || "—"}
            <br />
            <strong>Organizer:</strong> {presenterName}
          </p>
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="host-req-org" style={{ display: "block", marginBottom: 8 }}>
          Your organization
        </label>
        <select
          id="host-req-org"
          name="organizationId"
          className="input"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" }}
        >
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="host-req-email" style={{ display: "block", marginBottom: 8 }}>
          Email
        </label>
        <input
          id="host-req-email"
          name="email"
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label className="label" htmlFor="host-req-name" style={{ display: "block", marginBottom: 8 }}>
          Your name
        </label>
        <input
          id="host-req-name"
          name="name"
          className="input"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label className="label" htmlFor="host-req-msg" style={{ display: "block", marginBottom: 8 }}>
          Message (optional)
        </label>
        <textarea
          id="host-req-msg"
          name="message"
          className="input"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 88 }}
        />
      </div>
      <button
        type="submit"
        className="btn accent"
        disabled={pending || !email.includes("@") || !name.trim() || organizations.length === 0}
        aria-busy={pending}
        style={{ width: "100%" }}
      >
        {pending ? "Sending…" : "Submit request"}
      </button>
      <div aria-live="polite" aria-atomic="true">
        {status ? (
          <p style={{ margin: 0, fontSize: 14 }} role={status.startsWith("Thanks") ? "status" : "alert"}>
            {status}
          </p>
        ) : null}
      </div>
    </form>
  );
}
