import type { Metadata } from "next";

import { PlayerCancelPage } from "@/components/features/player-cancel/PlayerCancelPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Signup cancellation",
  description: "Confirm the status of your signup cancellation request.",
  pathname: "/signup/cancel",
  noIndex: true,
});

type CancelStatus = "done" | "invalid" | "not-found" | "not-eligible" | "too-late" | "failed";

function normalizeStatus(raw: string | undefined): CancelStatus {
  if (raw === "done") return "done";
  if (raw === "not-found") return "not-found";
  if (raw === "not-eligible") return "not-eligible";
  if (raw === "too-late") return "too-late";
  if (raw === "failed") return "failed";
  return "invalid";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  return <PlayerCancelPage status={normalizeStatus(params.status)} />;
}
