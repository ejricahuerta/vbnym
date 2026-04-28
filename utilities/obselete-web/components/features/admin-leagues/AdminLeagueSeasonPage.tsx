import Link from "next/link";
import { notFound } from "next/navigation";

import { AttachLeagueFixtureForm } from "@/components/features/admin-leagues/AttachLeagueFixtureForm";
import { ConfirmLeaguePaymentButton } from "@/components/features/admin-leagues/ConfirmLeaguePaymentButton";
import { CreateFacilityPermitForm } from "@/components/features/admin-leagues/CreateFacilityPermitForm";
import { SixBackSection } from "@/components/shared/SixBackPageShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getLeagueByIdForAdmin,
  getSeasonByIdForAdmin,
  listFacilityPermitsForSeasonAdmin,
  listPendingLeaguePaymentsForSeason,
  listTeamsForSeasonAdmin,
} from "@/server/queries/admin-leagues";
import { listRecentGamesForAdmin } from "@/server/queries/games";

type Props = { leagueId: string; seasonId: string };

export async function AdminLeagueSeasonPage({ leagueId, seasonId }: Props) {
  const [league, season, permits, payments, teams, games] = await Promise.all([
    getLeagueByIdForAdmin(leagueId),
    getSeasonByIdForAdmin(seasonId),
    listFacilityPermitsForSeasonAdmin(seasonId),
    listPendingLeaguePaymentsForSeason(seasonId),
    listTeamsForSeasonAdmin(seasonId),
    listRecentGamesForAdmin(50),
  ]);

  if (!league || !season || season.league_id !== league.id) notFound();

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/admin/leagues/${league.id}`} className="text-sm text-muted-foreground underline">
          ← {league.name}
        </Link>
        <h1 className="display mt-2 text-4xl">{season.name}</h1>
        <p className="text-sm text-muted-foreground">/{season.slug}</p>
      </div>

      <SixBackSection title="Facility Permits" eyebrow="Season Control" className="mt-0">
        <h2 className="text-lg font-semibold">Facility permits</h2>
        <p className="text-sm text-muted-foreground">
          At least one <strong>active</strong> permit with valid dates is required before linking
          games to this season.
        </p>
        <CreateFacilityPermitForm seasonId={season.id} />
        {permits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No permits on file.</p>
        ) : (
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {permits.map((p: { id: string; issuer_type: string; status: string; reference_number?: string | null }) => (
              <li key={p.id}>
                {p.issuer_type} → {p.status}
                {p.reference_number ? ` (${p.reference_number})` : ""}
              </li>
            ))}
          </ul>
        )}
      </SixBackSection>

      <SixBackSection title="Link Fixtures" eyebrow="Season Control" className="mt-0">
        <h2 className="text-lg font-semibold">Link game (fixture)</h2>
        <AttachLeagueFixtureForm seasonId={season.id} games={games} teams={teams} />
      </SixBackSection>

      <SixBackSection title="Pending Transfers" eyebrow="Season Control" className="mt-0">
        <h2 className="text-lg font-semibold">Pending e-transfers</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending payments.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.payment_id}>
                  <TableCell>{p.team_name}</TableCell>
                  <TableCell>
                    {p.member_name ?? "→"}
                    <div className="text-xs text-muted-foreground">{p.member_email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.reference_code}</TableCell>
                  <TableCell className="text-right">
                    <ConfirmLeaguePaymentButton paymentId={p.payment_id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SixBackSection>
    </div>
  );
}
