import { AdminLeagueDetailPage } from "@/components/features/admin-leagues/AdminLeagueDetailPage";

type Props = { params: Promise<{ leagueId: string }> };

export default async function Page({ params }: Props) {
  const { leagueId } = await params;
  return <AdminLeagueDetailPage leagueId={leagueId} />;
}
