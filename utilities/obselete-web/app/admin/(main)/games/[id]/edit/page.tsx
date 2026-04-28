import { AdminEditGamePage } from "@/components/features/admin-edit-game/AdminEditGamePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminEditGamePage id={id} />;
}
