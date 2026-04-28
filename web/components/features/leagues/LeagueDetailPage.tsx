import Link from "next/link";
import { notFound } from "next/navigation";

import { PlayerPageHeading } from "@/components/layout/player-page-heading";
import { SixBackPageShell, SixBackSection } from "@/components/shared/SixBackPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeagueBySlug } from "@/server/queries/leagues";
import { createClient } from "@/lib/supabase/server";

type Props = { leagueSlug: string };

export async function LeagueDetailPage({ leagueSlug }: Props) {
  const league = await getLeagueBySlug(leagueSlug);
  if (!league) notFound();

  const supabase = await createClient();
  const { data: seasons } = await supabase
    .from("league_seasons")
    .select("id, name, slug, description, listed")
    .eq("league_id", league.id)
    .order("created_at", { ascending: false });

  const publicSeasons = (seasons ?? []).filter((s) => s.listed !== false);

  return (
    <SixBackPageShell className="max-w-4xl">
      <PlayerPageHeading title={league.name} description={league.description ?? ""} />
      <SixBackSection
        title="Seasons"
        eyebrow="League Detail"
        description="Choose a season to view divisions, registration steps, and schedule details."
      >
      <div className="space-y-4">
        {publicSeasons.length === 0 ? (
          <Card className="rounded-xl border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No public seasons yet.
            </CardContent>
          </Card>
        ) : (
          publicSeasons.map((s) => (
            <Card key={s.id as string} className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{s.name as string}</CardTitle>
                {s.description ? (
                  <p className="text-sm text-muted-foreground">{s.description as string}</p>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild className="rounded-xl">
                  <Link href={`/leagues/${league.slug}/${s.slug as string}`}>
                    Season details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </SixBackSection>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/leagues" className="underline underline-offset-4">
          All leagues
        </Link>
      </p>
    </SixBackPageShell>
  );
}
