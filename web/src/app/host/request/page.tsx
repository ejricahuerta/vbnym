import type { Metadata } from "next";

import { HostRequestPage } from "@/components/features/host-request/HostRequestPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Host access request",
  description: "Request access to host volleyball games on 6ix Back.",
  pathname: "/host/request",
  noIndex: true,
});

export default async function Page({ searchParams }: { searchParams: Promise<{ game?: string }> }) {
  const params = await searchParams;
  const game = typeof params.game === "string" ? params.game.trim() : undefined;
  return <HostRequestPage gameId={game} />;
}
