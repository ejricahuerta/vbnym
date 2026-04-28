import { SixBackSection } from "@/components/shared/SixBackPageShell";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminPlayersMetrics } from "@/server/queries/admin-players";

export async function AdminPlayersPage() {
  const players = await getAdminPlayersMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl">Players</h1>
        <p className="mt-2 text-sm text-muted-foreground">Player status and participation signals derived from signup history.</p>
      </div>

      <SixBackSection eyebrow="Admin" title="Player status board" className="mt-0">
        {players.length === 0 ? (
          <Card size="sm" className="border-dashed py-6 text-center shadow-none">
            <CardContent className="py-0 text-sm text-muted-foreground">No player signups yet.</CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b-2 border-border text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Signups</th>
                  <th className="px-3 py-2">Paid</th>
                  <th className="px-3 py-2">Unpaid</th>
                  <th className="px-3 py-2">Last game date</th>
                  <th className="px-3 py-2">Last signup</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.email} className="border-b border-border/60">
                    <td className="px-3 py-2 font-medium">{player.name}</td>
                    <td className="px-3 py-2">{player.email}</td>
                    <td className="px-3 py-2">{player.totalSignups}</td>
                    <td className="px-3 py-2">{player.paidCount}</td>
                    <td className="px-3 py-2">{player.unpaidCount}</td>
                    <td className="px-3 py-2">{player.latestGameDate ?? "→"}</td>
                    <td className="px-3 py-2">{player.latestSignupAt ? player.latestSignupAt.slice(0, 10) : "→"}</td>
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
