import type { Metadata } from "next";

import { PlayerPortalPage } from "@/components/features/player/PlayerPortalPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Player portal",
  description: "Manage your upcoming games and roster status.",
  pathname: "/player",
  noIndex: true,
});

export default function Page() {
  return <PlayerPortalPage />;
}
