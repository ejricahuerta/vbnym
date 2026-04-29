import type { Metadata } from "next";

import { LandingPage } from "@/components/features/landing/LandingPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Drop-ins, leagues, and tournaments in Toronto",
  description:
    "Find volleyball drop-ins, leagues, and tournaments across Toronto and the GTA. Sign up fast with Interac-only payment matching.",
  pathname: "/",
  keywords: ["Toronto volleyball", "GTA volleyball", "drop-in volleyball", "co-ed volleyball"],
});

export default function Page() {
  return <LandingPage />;
}
