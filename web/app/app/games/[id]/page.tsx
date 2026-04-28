import { GameDetailReferencePage } from "@/components/features/game-detail/GameDetailReferencePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameDetailReferencePage id={id} />;
}
