import type { Metadata } from "next";

import { CommunityHubPage } from "@/components/features/community-hub/CommunityHubPage";

export const metadata: Metadata = {
  title: "Community and feedback | 6IX BACK Volleyball",
  description:
    "Report bugs, suggest features, ask about sponsoring or hosting a game, or reach out about advertising. Help us improve 6IX BACK Volleyball.",
};

export default function Page() {
  return <CommunityHubPage />;
}
