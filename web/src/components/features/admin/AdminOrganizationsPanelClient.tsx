"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { createOrganization, deleteOrganization } from "@/server/actions/organizations-admin";
import { DEFAULT_ORGANIZATION_ID } from "@/lib/organization-default";
import type { OrganizationRow } from "@/types/domain";

export function AdminOrganizationsPanelClient({ initialOrganizations }: { initialOrganizations: OrganizationRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh(): void {
    router.refresh();
  }

  function submitCreate(e: FormEvent): void {
    e.preventDefault();
    setBanner(null);
    const fd = new FormData();
    fd.set("name", name.trim());
    startTransition(async () => {
      const res = await createOrganization(fd);
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      setName("");
      setBanner("Organization created.");
      refresh();
    });
  }

  function submitDelete(id: string): void {
    setBanner(null);
    const fd = new FormData();
    fd.set("organizationId", id);
    startTransition(async () => {
      const res = await deleteOrganization(fd);
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      setBanner("Organization deleted.");
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

      <form onSubmit={submitCreate} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <label className="label" htmlFor="admin-org-name" style={{ display: "block", marginBottom: 8 }}>
            New organization name
          </label>
          <input
            id="admin-org-name"
            name="name"
            className="input"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Game Time Arena"
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <button type="submit" className="btn accent" disabled={pending || name.trim().length < 2} aria-busy={pending}>
          Add organization
        </button>
      </form>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="label" style={{ padding: "12px 14px", borderBottom: "2px solid var(--ink)", background: "var(--bg)" }}>
          Organizations ({initialOrganizations.length})
        </div>
        {initialOrganizations.length === 0 ? (
          <p style={{ margin: 0, padding: 16, fontSize: 14, color: "var(--ink-2)" }}>No organizations found.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {initialOrganizations.map((row) => (
              <li
                key={row.id}
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
                <span style={{ fontWeight: 600 }}>{row.name}</span>
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={pending || row.id === DEFAULT_ORGANIZATION_ID}
                  onClick={() => submitDelete(row.id)}
                  title={row.id === DEFAULT_ORGANIZATION_ID ? "Default organization cannot be deleted." : undefined}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
