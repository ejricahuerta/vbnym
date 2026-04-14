import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileDock } from "@/components/layout/mobile-dock";
import { GameDetailClient } from "@/components/games/game-detail-client";
import { getGameWithSignups } from "@/lib/data/games";
import { Suspense } from "react";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getGameWithSignups(id);
  if (!data) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <GameDetailClient game={data.game} signups={data.signups} />
      <Suspense fallback={null}>
        <MobileDock />
      </Suspense>
    </div>
  );
}
