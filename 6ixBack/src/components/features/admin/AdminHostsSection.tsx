import { AdminHostsPanelClient } from "@/components/features/admin/AdminHostsPanelClient";
import type { ApprovedHostRow, HostAccessRequestRow } from "@/types/hosts";

export function AdminHostsSection({
  hosts,
  requests,
}: {
  hosts: ApprovedHostRow[];
  requests: HostAccessRequestRow[];
}) {
  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div>
        <h2 className="display" style={{ fontSize: 22, margin: "0 0 12px", letterSpacing: "-.02em" }}>
          Approved hosts
        </h2>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 640 }}>
          Only these emails can use host sign-in. Add someone before they can request a magic link.
        </p>
        <AdminHostsPanelClient initialHosts={hosts} initialRequests={requests} />
      </div>
    </div>
  );
}
