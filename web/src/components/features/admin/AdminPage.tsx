import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminOverview } from "@/server/queries/admin";
import { listApprovedHosts, listPendingHostAccessRequests } from "@/server/queries/hosts";
import { listOrganizations } from "@/server/queries/organizations";
import { AdminHostsSection } from "@/components/features/admin/AdminHostsSection";
import { AdminOrganizationsSection } from "@/components/features/admin/AdminOrganizationsSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthorized } from "@/lib/auth";

type AdminTab = "overview" | "events" | "hosts" | "organizations" | "players" | "venues" | "reports";

const tabs: AdminTab[] = ["overview", "events", "hosts", "organizations", "players", "venues", "reports"];

function tabLabel(tab: AdminTab): string {
  if (tab === "organizations") return "Organizations";
  return tab;
}

export async function AdminPage({ tab = "overview" }: { tab?: string }) {
  const authorized = await isAdminAuthorized();
  if (!authorized) {
    redirect("/admin/login");
  }
  const activeTab: AdminTab = tabs.includes(tab as AdminTab) ? (tab as AdminTab) : "overview";

  const stats = await getAdminOverview();
  const hostsData =
    activeTab === "hosts"
      ? await Promise.all([listApprovedHosts(), listPendingHostAccessRequests()])
      : null;
  const hostsList = hostsData?.[0] ?? [];
  const requestsList = hostsData?.[1] ?? [];

  const organizationsList = activeTab === "organizations" ? await listOrganizations() : [];

  return (
    <div>
      <SiteHeader />
      <section style={{ background: "var(--ink)", color: "var(--paper)", borderBottom: "2px solid var(--ink)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span className="chip gold" style={{ letterSpacing: ".12em" }}>
              ADMIN
            </span>
            <span className="mono" style={{ fontSize: 12, letterSpacing: ".08em", color: "rgba(251,248,241,.5)", fontWeight: 600 }}>
              DATABASE COUNTS
            </span>
          </div>
          <h1 className="display" style={{ fontSize: "clamp(44px, 8vw, 88px)", margin: "0 0 24px", letterSpacing: "-.04em", color: "var(--paper)" }}>
            Control{" "}
            <span className="serif-display" style={{ fontStyle: "italic", color: "var(--accent)", textTransform: "lowercase" }}>
              room.
            </span>
          </h1>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tabs.map((item) => (
              <Link
                key={item}
                href={`/admin?tab=${item}`}
                className="admin-tab-pill motion-press"
                style={{
                  padding: "8px 13px",
                  fontSize: 12.5,
                  background: activeTab === item ? "var(--accent)" : "transparent",
                  color: activeTab === item ? "var(--ink)" : "var(--paper)",
                  borderColor: activeTab === item ? "var(--accent)" : "var(--paper)",
                }}
              >
                {tabLabel(item)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 18px 60px" }}>
        {activeTab === "overview" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 14 }}>
            <StatCard label="Games" value={String(stats.games)} meta="All statuses" />
            <StatCard label="Sign-ups" value={String(stats.signups)} meta="All time" />
            <StatCard label="Paid" value={String(stats.paid)} meta="Marked received" />
            <StatCard label="Waitlist" value={String(stats.waitlist)} meta="Players" />
          </div>
        ) : null}

        {activeTab === "events" ? <EventsTable /> : null}
        {activeTab === "hosts" ? <AdminHostsSection hosts={hostsList} requests={requestsList} /> : null}
        {activeTab === "organizations" ? <AdminOrganizationsSection organizations={organizationsList} /> : null}
        {activeTab === "players" ? <PlayersTable /> : null}
        {activeTab === "venues" ? <VenuesTable /> : null}
        {activeTab === "reports" ? <ReportsTable /> : null}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Link href="/browse" className="btn ghost motion-press">Events</Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function AdminTabPlaceholder({ label }: { label: string }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
        {label}
      </p>
    </div>
  );
}

function EventsTable() {
  return <AdminTabPlaceholder label="No event listing in this admin view yet." />;
}

function PlayersTable() {
  return <AdminTabPlaceholder label="No player directory in this admin view yet." />;
}

function VenuesTable() {
  return <AdminTabPlaceholder label="No venue directory in this admin view yet." />;
}

function ReportsTable() {
  return <AdminTabPlaceholder label="No reports in this admin view yet." />;
}

function StatCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="label">{label}</div>
      <div className="display" style={{ fontSize: 44 }}>{value}</div>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{meta}</div>
    </div>
  );
}
