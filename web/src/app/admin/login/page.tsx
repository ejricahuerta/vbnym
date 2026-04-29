import type { Metadata } from "next";

import { AdminLoginPage } from "@/components/features/login/AdminLoginPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Admin login",
  description: "Sign in to access admin controls for 6ix Back.",
  pathname: "/admin/login",
  noIndex: true,
});

export default function Page() {
  return <AdminLoginPage />;
}
