import Link from "next/link";
import { notFound } from "next/navigation";

import { PlayerPageHeading } from "@/components/layout/player-page-heading";
import { SixBackPageShell, SixBackSection } from "@/components/shared/SixBackPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicSeasonBySlugs } from "@/server/queries/leagues";

type Props = { leagueSlug: string; seasonSlug: string };

export async function LeagueSeasonPublicPage({ leagueSlug, seasonSlug }: Props) {
  const bundle = await getPublicSeasonBySlugs(leagueSlug, seasonSlug);
  if (!bundle) notFound();

  const { league, season, divisions } = bundle;

  return (
    <SixBackPageShell className="max-w-4xl">
      <PlayerPageHeading
        title={`${league.name} → ${season.name}`}
        description={season.description ?? "Season details and team registration."}
      />
      <SixBackSection title="Team Actions" eyebrow="Season Portal" className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <Button asChild size="lg" className="rounded-xl">
          <Link
            href={`/leagues/${league.slug}/${season.slug}/register-team`}
          >
            Register a team (captain)
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="rounded-xl">
          <Link href="/app/league-team">Team portal (schedule and roster)</Link>
        </Button>
      </div>
      <Card className="mt-6 rounded-xl">
        <CardContent className="space-y-3 py-6 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Divisions: </span>
            {divisions.length
              ? divisions.map((d) => d.name).join(", ")
              : "None yet → ask the organizer."}
          </p>
          <p>
            Players join when the captain adds their email. Each player gets an invite to accept the
            waiver and receive e-transfer instructions.
          </p>
        </CardContent>
      </Card>
      </SixBackSection>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href={`/leagues/${league.slug}`} className="underline underline-offset-4">
          Back to {league.name}
        </Link>
        {" · "}
        <Link href="/leagues" className="underline underline-offset-4">
          All leagues
        </Link>
      </p>
    </SixBackPageShell>
  );
}
