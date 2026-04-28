import type { Metadata } from "next";

import { LeagueRegisterTeamPage } from "@/components/features/leagues/LeagueRegisterTeamPage";

type Props = { params: Promise<{ leagueSlug: string; seasonSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seasonSlug } = await params;
  return {
    title: `Register team | ${seasonSlug} | 6IX BACK Volleyball`,
  };
}

export default async function Page({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;
  return <LeagueRegisterTeamPage leagueSlug={leagueSlug} seasonSlug={seasonSlug} />;
}
