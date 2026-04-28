import Link from "next/link";

import { CreateLeagueForm } from "@/components/features/admin-leagues/CreateLeagueForm";
import { SixBackSection } from "@/components/shared/SixBackPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listLeaguesForAdmin } from "@/server/queries/admin-leagues";

export async function AdminLeaguesHubPage() {
  const leagues = await listLeaguesForAdmin();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="display text-4xl">Leagues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create leagues and seasons, permits, and link scheduled games to fixtures.
        </p>
      </div>
      <SixBackSection title="Create New League" eyebrow="Admin Tools" className="mt-0">
        <h2 className="text-lg font-semibold">New league</h2>
        <CreateLeagueForm />
      </SixBackSection>
      <SixBackSection title="All Leagues" eyebrow="Directory" className="mt-0">
        <h2 className="text-lg font-semibold">All leagues</h2>
        {leagues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leagues yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {leagues.map((l) => (
              <Card key={l.id} className="rounded-xl">
                <CardHeader>
                  <CardTitle className="text-base">{l.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">/{l.slug}</p>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/admin/leagues/${l.id}`}
                    className="text-sm font-medium text-accent underline underline-offset-4"
                  >
                    Manage
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SixBackSection>
    </div>
  );
}
