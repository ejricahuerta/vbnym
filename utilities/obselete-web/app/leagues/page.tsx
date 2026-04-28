import type { Metadata } from "next";

import { LeaguesIndexPage } from "@/components/features/leagues/LeaguesIndexPage";

export const metadata: Metadata = {
  title: "Leagues | 6IX BACK Volleyball",
  description: "Season volleyball leagues → team registration and roster invites.",
};

export default function Page() {
  return <LeaguesIndexPage />;
}
