import type { Metadata } from "next";

import { HostDashboardPage } from "@/components/features/host-dashboard/HostDashboardPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Host dashboard",
  description: "Manage your hosted volleyball games, signups, and payment status.",
  pathname: "/host",
  noIndex: true,
});

export default function Page() {
  return <HostDashboardPage />;
}
