import { AdminOrganizationsPanelClient } from "@/components/features/admin/AdminOrganizationsPanelClient";
import { DEFAULT_ORGANIZATION_ID, DEFAULT_ORGANIZATION_NAME } from "@/lib/organization-default";
import type { OrganizationRow } from "@/types/domain";

export function AdminOrganizationsSection({ organizations }: { organizations: OrganizationRow[] }) {
  const defaultLabel =
    organizations.find((o) => o.id === DEFAULT_ORGANIZATION_ID)?.name ?? DEFAULT_ORGANIZATION_NAME;
  return (
    <div>
      <h2 className="display" style={{ fontSize: 22, margin: "0 0 14px", letterSpacing: "-.02em" }}>
        Organizations
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 640 }}>
        Hosts and players pick from this list when publishing or signing up. The default entry ({defaultLabel}) cannot be
        removed.
      </p>
      <AdminOrganizationsPanelClient initialOrganizations={organizations} />
    </div>
  );
}
