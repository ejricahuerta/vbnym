import type { Metadata } from "next";

import { HostLoginPage } from "@/components/features/login/HostLoginPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Host login",
  description: "Sign in to manage your host game listings.",
  pathname: "/host/login",
  noIndex: true,
});

export default function Page() {
  return <HostLoginPage />;
}
