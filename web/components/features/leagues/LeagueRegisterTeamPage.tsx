import Link from "next/link";
import { notFound } from "next/navigation";

import { LeagueRegisterTeamForm } from "@/components/features/leagues/LeagueRegisterTeamForm";
import { PlayerPageHeading } from "@/components/layout/player-page-heading";
import { SixBackPageShell, SixBackSection } from "@/components/shared/SixBackPageShell";
import { getPublicSeasonBySlugs, getLatestWaiverVersionForSeason } from "@/server/queries/leagues";

type Props = { leagueSlug: string; seasonSlug: string };

export async function LeagueRegisterTeamPage({ leagueSlug, seasonSlug }: Props) {
  const bundle = await getPublicSeasonBySlugs(leagueSlug, seasonSlug);
  if (!bundle) notFound();

  const { league, season, divisions } = bundle;
  const waiver = await getLatestWaiverVersionForSeason(season.id);

  if (divisions.length === 0 || !waiver) {
    return (
      <SixBackPageShell className="max-w-4xl">
        <PlayerPageHeading
          title="Registration unavailable"
          description="This season is not ready for registration yet (missing division or waiver)."
        />
        <p className="mt-6 text-center text-sm">
          <Link href={`/leagues/${league.slug}/${season.slug}`} className="underline">
            Back to season
          </Link>
        </p>
      </SixBackPageShell>
    );
  }

  return (
    <SixBackPageShell className="max-w-4xl">
      <PlayerPageHeading
        title="Register your team"
        description={`${league.name} → ${season.name}. Captains accept the waiver on behalf of the team and invite players by email.`}
      />
      <SixBackSection title="Registration Form" eyebrow="Captain Setup" className="mt-6">
        <LeagueRegisterTeamForm
          leagueSlug={league.slug}
          seasonSlug={season.slug}
          seasonId={season.id}
          divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
          waiverVersionLabel={waiver.version_label}
          waiverBodyPreview={
            waiver.body_text.length > 1200
              ? `${waiver.body_text.slice(0, 1200)}…`
              : waiver.body_text
          }
        />
      </SixBackSection>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href={`/leagues/${league.slug}/${season.slug}`} className="underline underline-offset-4">
          Back to season
        </Link>
      </p>
    </SixBackPageShell>
  );
}
