import { GameDetailPage } from "@/components/features/game-detail/GameDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameDetailPage id={id} />;
}
