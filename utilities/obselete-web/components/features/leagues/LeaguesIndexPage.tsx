import Link from "next/link";

import { PlayerPageHeading } from "@/components/layout/player-page-heading";
import { SixBackPageShell, SixBackSection } from "@/components/shared/SixBackPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublicLeagues } from "@/server/queries/leagues";

export async function LeaguesIndexPage() {
  const leagues = await listPublicLeagues();

  return (
    <SixBackPageShell className="max-w-4xl">
      <PlayerPageHeading
        title="Leagues"
        description="Season-based volleyball leagues → register your team or accept a roster invite."
      />
      <SixBackSection
        title="League Programs"
        eyebrow="League Hub"
        description="Browse active league programs, then open each detail page for divisions, seasons, and registration steps."
      >
      <div className="space-y-4">
        {leagues.length === 0 ? (
          <Card className="rounded-xl border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No leagues published yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          leagues.map((l) => (
            <Card key={l.id} className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{l.name}</CardTitle>
                {l.description ? (
                  <p className="text-sm text-muted-foreground">{l.description}</p>
                ) : null}
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="rounded-xl">
                  <Link href={`/leagues/${l.slug}`}>View league</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </SixBackSection>
    </SixBackPageShell>
  );
}
