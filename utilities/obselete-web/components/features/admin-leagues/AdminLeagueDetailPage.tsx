import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateLeagueSeasonForm } from "@/components/features/admin-leagues/CreateLeagueSeasonForm";
import { SixBackSection } from "@/components/shared/SixBackPageShell";
import {
  getLeagueByIdForAdmin,
  listSeasonsForLeagueAdmin,
} from "@/server/queries/admin-leagues";

type Props = { leagueId: string };

export async function AdminLeagueDetailPage({ leagueId }: Props) {
  const league = await getLeagueByIdForAdmin(leagueId);
  if (!league) notFound();

  const seasons = await listSeasonsForLeagueAdmin(leagueId);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/leagues" className="text-sm text-muted-foreground underline">
          ← Leagues
        </Link>
        <h1 className="display mt-2 text-4xl">{league.name}</h1>
        <p className="text-sm text-muted-foreground">/{league.slug}</p>
      </div>
      <SixBackSection title="New Season" eyebrow="League Setup" className="mt-0">
        <h2 className="text-lg font-semibold">New season</h2>
        <CreateLeagueSeasonForm leagueId={league.id} />
      </SixBackSection>
      <SixBackSection title="Season Directory" eyebrow="League Setup" className="mt-0">
        <h2 className="text-lg font-semibold">Seasons</h2>
        {seasons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No seasons yet.</p>
        ) : (
          <ul className="space-y-2">
            {seasons.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/leagues/${league.id}/seasons/${s.id}`}
                  className="font-medium text-accent underline underline-offset-4"
                >
                  {s.name}
                </Link>
                <span className="text-sm text-muted-foreground"> /{s.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </SixBackSection>
    </div>
  );
}
