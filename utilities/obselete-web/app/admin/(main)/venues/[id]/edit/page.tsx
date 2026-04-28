import { AdminEditVenuePage } from "@/components/features/admin-edit-venue/AdminEditVenuePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminEditVenuePage id={id} />;
}
