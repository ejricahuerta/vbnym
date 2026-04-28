import type { Metadata } from "next";

import { LeagueDetailPage } from "@/components/features/leagues/LeagueDetailPage";

type Props = { params: Promise<{ leagueSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leagueSlug } = await params;
  return {
    title: `${leagueSlug} | Leagues | 6IX BACK Volleyball`,
  };
}

export default async function Page({ params }: Props) {
  const { leagueSlug } = await params;
  return <LeagueDetailPage leagueSlug={leagueSlug} />;
}
