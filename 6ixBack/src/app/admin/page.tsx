import { AdminPage } from "@/components/features/admin/AdminPage";

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  return <AdminPage tab={params.tab} />;
}
