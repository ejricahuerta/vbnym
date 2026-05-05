"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";

import {
  addApprovedHost,
  approveHostAccessRequest,
  removeApprovedHost,
  updateApprovedHost,
} from "@/server/actions/hosts-admin";
import type { ApprovedHostRow, HostAccessRequestRow } from "@/types/hosts";

function defaultDisplayName(row: ApprovedHostRow): string {
  const existing = row.display_name?.trim();
  if (existing && existing.length >= 2) return existing;
  const local = row.email.split("@")[0]?.trim() ?? "";
  if (local.length >= 2) return local;
  return row.email;
}

function formatPhoneInputDisplay(digits: string | null): string {
  if (!digits?.trim()) return "";
  return digits;
}

function AdminApprovedHostRow({
  row,
  listActionPending,
  onRemove,
}: {
  row: ApprovedHostRow;
  listActionPending: boolean;
  onRemove: (email: string) => void;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(() => defaultDisplayName(row));
  const [email, setEmail] = useState(row.email);
  const [phone, setPhone] = useState(() => formatPhoneInputDisplay(row.phone_e164));
  const [rowError, setRowError] = useState<string | null>(null);
  const [savePending, startSave] = useTransition();
  const disabled = listActionPending || savePending;

  useEffect(() => {
    setDisplayName(defaultDisplayName(row));
    setEmail(row.email);
    setPhone(formatPhoneInputDisplay(row.phone_e164));
    setRowError(null);
  }, [row.email, row.display_name, row.phone_e164]);

  function save(): void {
    setRowError(null);
    const fd = new FormData();
    fd.set("currentEmail", row.email);
    fd.set("newEmail", email.trim().toLowerCase());
    fd.set("displayName", displayName.trim());
    fd.set("hostPhone", phone);
    startSave(async () => {
      const res = await updateApprovedHost(fd);
      if (!res.ok) {
        setRowError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li
      style={{
        display: "grid",
        gap: 10,
        padding: "14px 14px 16px",
        borderBottom: "1px solid rgba(17,17,20,.12)",
        listStyle: "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
          alignItems: "end",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <label className="label" style={{ display: "block", marginBottom: 6, fontSize: 11 }}>
            Name
          </label>
          <input
            className="input"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={disabled}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <label className="label" style={{ display: "block", marginBottom: 6, fontSize: 11 }}>
            Email (sign-in)
          </label>
          <input
            className="input"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <label className="label" style={{ display: "block", marginBottom: 6, fontSize: 11 }}>
            Phone (optional)
          </label>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={disabled}
            placeholder="e.g. 14165551234"
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>
      </div>
      {rowError ? (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: "var(--warn)", fontWeight: 600 }}>
          {rowError}
        </p>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" className="btn sm ghost" disabled={disabled} onClick={() => onRemove(row.email)}>
          Remove from list
        </button>
        <button type="button" className="btn sm accent" disabled={disabled} onClick={save} aria-busy={savePending}>
          {savePending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </li>
  );
}

export function AdminHostsPanelClient({
  initialHosts,
  initialRequests,
}: {
  initialHosts: ApprovedHostRow[];
  initialRequests: HostAccessRequestRow[];
}) {
  const router = useRouter();
  const [addEmail, setAddEmail] = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh(): void {
    router.refresh();
  }

  function submitAdd(e: FormEvent): void {
    e.preventDefault();
    setBanner(null);
    const fd = new FormData();
    fd.set("email", addEmail.trim().toLowerCase());
    fd.set("displayName", addDisplayName.trim());
    fd.set("hostPhone", addPhone);
    startTransition(async () => {
      const res = await addApprovedHost(fd);
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      setAddEmail("");
      setAddDisplayName("");
      setAddPhone("");
      setBanner("Host added.");
      refresh();
    });
  }

  function submitRemove(email: string): void {
    setBanner(null);
    const fd = new FormData();
    fd.set("email", email);
    startTransition(async () => {
      const res = await removeApprovedHost(fd);
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      setBanner("Removed.");
      refresh();
    });
  }

  function submitApprove(requestId: string): void {
    setBanner(null);
    const fd = new FormData();
    fd.set("requestId", requestId);
    startTransition(async () => {
      const res = await approveHostAccessRequest(fd);
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      setBanner("Request approved and host added.");
      refresh();
    });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {banner ? (
        <p role="status" style={{ margin: 0, fontSize: 14 }}>
          {banner}
        </p>
      ) : null}

      <form onSubmit={submitAdd} style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
            <label className="label" htmlFor="admin-add-host-email" style={{ display: "block", marginBottom: 8 }}>
              Add host email
            </label>
            <input
              id="admin-add-host-email"
              name="email"
              className="input"
              type="email"
              autoComplete="off"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="host@example.com"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <label className="label" htmlFor="admin-add-host-name" style={{ display: "block", marginBottom: 8 }}>
              Display name (optional)
            </label>
            <input
              id="admin-add-host-name"
              className="input"
              type="text"
              autoComplete="off"
              value={addDisplayName}
              onChange={(e) => setAddDisplayName(e.target.value)}
              placeholder="Defaults to the part before @ in email"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <label className="label" htmlFor="admin-add-host-phone" style={{ display: "block", marginBottom: 8 }}>
              Phone (optional)
            </label>
            <input
              id="admin-add-host-phone"
              className="input"
              type="tel"
              inputMode="tel"
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              placeholder="E.164 digits"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <button type="submit" className="btn accent" disabled={pending || !addEmail.includes("@")} aria-busy={pending} style={{ height: 44 }}>
            Add host
          </button>
        </div>
      </form>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="label" style={{ padding: "12px 14px", borderBottom: "2px solid var(--ink)", background: "var(--bg)" }}>
          Approved list ({initialHosts.length})
        </div>
        {initialHosts.length === 0 ? (
          <p style={{ margin: 0, padding: 16, fontSize: 14, color: "var(--ink-2)" }}>
            No hosts yet. Add at least one email so someone can sign in as host.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {initialHosts.map((row) => (
              <AdminApprovedHostRow key={row.email} row={row} listActionPending={pending} onRemove={submitRemove} />
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="display" style={{ fontSize: 18, margin: "0 0 10px", letterSpacing: "-.02em" }}>
          Access requests
        </h3>
        {initialRequests.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)" }}>No pending requests.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {initialRequests.map((r) => (
              <div key={r.id} className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{r.name}</div>
                <div className="mono" style={{ fontSize: 12, marginBottom: 8, wordBreak: "break-all" }}>
                  {r.email}
                </div>
                <div style={{ fontSize: 12, marginBottom: 8, color: "var(--ink-2)", lineHeight: 1.45 }}>
                  <strong>Organization:</strong>{" "}
                  {(Array.isArray(r.organizations) ? r.organizations[0] : r.organizations)?.name ?? "—"}
                </div>
                {r.context_game ? (
                  <div style={{ fontSize: 12, marginBottom: 8, color: "var(--ink-2)", lineHeight: 1.45 }}>
                    <strong>Linked game:</strong> {r.context_game.title} ·{" "}
                    {new Date(r.context_game.starts_at).toLocaleString("en-CA", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                ) : null}
                {r.message ? (
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{r.message}</p>
                ) : null}
                <button
                  type="button"
                  className="btn sm accent"
                  disabled={pending}
                  onClick={() => submitApprove(r.id)}
                >
                  Approve (add host)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
