import type { Metadata } from "next";

import { BrowsePage } from "@/components/features/browse/BrowsePage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Browse volleyball games in Toronto",
  description:
    "Browse live volleyball drop-ins, leagues, and tournaments in Toronto and the GTA. Filter by format, skill level, and date.",
  pathname: "/browse",
  keywords: ["volleyball schedule Toronto", "drop-in volleyball Toronto", "Toronto league volleyball"],
});

export default function Page() {
  return <BrowsePage />;
}
