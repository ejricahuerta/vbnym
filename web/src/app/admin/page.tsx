import type { Metadata } from "next";

import { AdminPage } from "@/components/features/admin/AdminPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Admin",
  description: "Administrative tools for 6ix Back operations.",
  pathname: "/admin",
  noIndex: true,
});

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  return <AdminPage tab={params.tab} />;
}
