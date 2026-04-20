import { AdminSignupsTable } from "@/components/admin/admin-signups-table";
import { PolicyBroadcastPanel } from "@/components/admin/policy-broadcast-panel";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSignupsPageData } from "@/server/queries/admin-signups";

export async function AdminSignupsPage() {
  const { list, err, gameById } = await getAdminSignupsPageData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Signups</h1>
        <p className="mt-2 hidden text-sm text-muted-foreground md:block">
          Mark players paid after e-transfer. Payment codes are generated at
          signup.
        </p>
      </div>
      <PolicyBroadcastPanel />
      {err ? (
        <Card size="sm" className="border-destructive/30 bg-destructive/10 py-3 text-destructive shadow-none">
          <CardContent className="px-3 py-0 text-sm">{err}</CardContent>
        </Card>
      ) : null}
      {!err && list.length === 0 ? (
        <Card size="sm" className="border-dashed py-6 text-center shadow-none">
          <CardContent className="py-0 text-sm text-muted-foreground">
            No signups yet.
          </CardContent>
        </Card>
      ) : null}
      {!err && list.length > 0 ? (
        <AdminSignupsTable signups={list} gameById={gameById} />
      ) : null}
    </div>
  );
}
