import { AdminLeagueSeasonPage } from "@/components/features/admin-leagues/AdminLeagueSeasonPage";

type Props = { params: Promise<{ leagueId: string; seasonId: string }> };

export default async function Page({ params }: Props) {
  const { leagueId, seasonId } = await params;
  return <AdminLeagueSeasonPage leagueId={leagueId} seasonId={seasonId} />;
}
