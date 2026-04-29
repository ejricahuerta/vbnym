import type { Metadata } from "next";

import { GameDetailPage } from "@/components/features/detail/GameDetailPage";
import { buildGameMetadata, buildStaticMetadata } from "@/lib/seo";
import { getGameWithRoster } from "@/server/queries/games";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getGameWithRoster(id);
  if (!data) {
    return buildStaticMetadata({
      title: "Game not found",
      description: "This game is no longer available. Browse current volleyball games in Toronto.",
      pathname: "/browse",
      noIndex: true,
    });
  }

  return buildGameMetadata(data.game);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameDetailPage gameId={id} />;
}
