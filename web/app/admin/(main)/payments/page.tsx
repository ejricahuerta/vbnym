import { AdminPaymentsPage } from "@/components/features/admin-payments/AdminPaymentsPage";

export default function Page({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  return <AdminPaymentsPage searchParams={searchParams} />;
}
