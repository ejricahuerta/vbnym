import type { Metadata } from "next";

import { PlayerLoginPage } from "@/components/features/login/PlayerLoginPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Player login",
  description: "Sign in to view your volleyball registrations and payment status.",
  pathname: "/login",
  noIndex: true,
});

export default function Page() {
  return <PlayerLoginPage />;
}
