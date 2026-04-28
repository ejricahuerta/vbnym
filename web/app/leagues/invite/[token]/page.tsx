import type { Metadata } from "next";

import { LeagueInviteAcceptPage } from "@/components/features/leagues/LeagueInviteAcceptPage";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Accept invite | 6IX BACK Volleyball",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: Props) {
  const { token } = await params;
  return <LeagueInviteAcceptPage token={token} />;
}
