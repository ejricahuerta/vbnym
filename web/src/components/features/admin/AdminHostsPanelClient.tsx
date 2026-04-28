"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { addApprovedHost, approveHostAccessRequest, removeApprovedHost } from "@/server/actions/hosts-admin";
import type { ApprovedHostRow, HostAccessRequestRow } from "@/types/hosts";

export function AdminHostsPanelClient({
  initialHosts,
  initialRequests,
}: {
  initialHosts: ApprovedHostRow[];
  initialRequests: HostAccessRequestRow[];
}) {
  const router = useRouter();
  const [addEmail, setAddEmail] = useState("");
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
    startTransition(async () => {
      const res = await addApprovedHost(fd);
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      setAddEmail("");
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

      <form onSubmit={submitAdd} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
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
        <button type="submit" className="btn accent" disabled={pending || !addEmail.includes("@")} aria-busy={pending}>
          Add host
        </button>
      </form>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="label" style={{ padding: "12px 14px", borderBottom: "2px solid var(--ink)", background: "var(--bg)" }}>
          Approved list ({initialHosts.length})
        </div>
        {initialHosts.length === 0 ? (
          <p style={{ margin: 0, padding: 16, fontSize: 14, color: "var(--ink-2)" }}>No hosts yet. Add at least one email so someone can sign in as host.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {initialHosts.map((row) => (
              <li
                key={row.email}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom: "1px solid rgba(17,17,20,.12)",
                  fontSize: 14,
                }}
              >
                <span style={{ wordBreak: "break-all", fontWeight: 600 }}>{row.email}</span>
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={pending}
                  onClick={() => submitRemove(row.email)}
                >
                  Remove
                </button>
              </li>
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
