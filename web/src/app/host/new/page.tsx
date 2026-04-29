import type { Metadata } from "next";

import { HostCreatePage } from "@/components/features/host-create/HostCreatePage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Create host game",
  description: "Create and publish a new volleyball game posting.",
  pathname: "/host/new",
  noIndex: true,
});

export default function Page() {
  return <HostCreatePage />;
}
