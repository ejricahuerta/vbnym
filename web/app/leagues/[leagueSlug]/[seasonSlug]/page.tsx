import type { Metadata } from "next";

import { LeagueSeasonPublicPage } from "@/components/features/leagues/LeagueSeasonPublicPage";

type Props = { params: Promise<{ leagueSlug: string; seasonSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leagueSlug, seasonSlug } = await params;
  return {
    title: `${seasonSlug} | ${leagueSlug} | 6IX BACK Volleyball`,
  };
}

export default async function Page({ params }: Props) {
  const { leagueSlug, seasonSlug } = await params;
  return <LeagueSeasonPublicPage leagueSlug={leagueSlug} seasonSlug={seasonSlug} />;
}
