import { GameDetailPage } from "@/components/features/detail/GameDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameDetailPage gameId={id} />;
}
