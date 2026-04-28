import { SixBackSection } from "@/components/shared/SixBackPageShell";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminHostsMetrics } from "@/server/queries/admin-hosts";

function pct(used: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((used / total) * 100)}%`;
}

export async function AdminHostsPage() {
  const hosts = await getAdminHostsMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl">Hosts</h1>
        <p className="mt-2 text-sm text-muted-foreground">Host leaderboard and payout mailbox activity from existing games and signups.</p>
      </div>

      <SixBackSection eyebrow="Admin" title="Host leaderboard" className="mt-0">
        {hosts.length === 0 ? (
          <Card size="sm" className="border-dashed py-6 text-center shadow-none">
            <CardContent className="py-0 text-sm text-muted-foreground">No host activity yet.</CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-2">Host</th>
                  <th className="px-3 py-2">Runs</th>
                  <th className="px-3 py-2">Seats</th>
                  <th className="px-3 py-2">Booked</th>
                  <th className="px-3 py-2">Fill</th>
                  <th className="px-3 py-2">Upcoming</th>
                  <th className="px-3 py-2">Last run</th>
                </tr>
              </thead>
              <tbody>
                {hosts.map((host) => (
                  <tr key={host.hostKey} className="border-b border-border/60">
                    <td className="px-3 py-2 font-medium">{host.payoutEmail}</td>
                    <td className="px-3 py-2">{host.gameCount}</td>
                    <td className="px-3 py-2">{host.totalCapacity}</td>
                    <td className="px-3 py-2">{host.totalBooked}</td>
                    <td className="px-3 py-2">{pct(host.totalBooked, host.totalCapacity)}</td>
                    <td className="px-3 py-2">{host.upcomingCount}</td>
                    <td className="px-3 py-2">{host.lastGameDate ?? "→"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SixBackSection>
    </div>
  );
}
