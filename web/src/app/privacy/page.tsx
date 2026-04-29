import type { Metadata } from "next";

import { PrivacyPolicyPage } from "@/components/features/legal-privacy/PrivacyPolicyPage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Privacy Policy | 6IX BACK Volleyball",
  description:
    "How 6IX BACK Volleyball collects, uses, and protects your personal information when you use our site or register for drop-in games.",
  pathname: "/privacy",
});

export default function Page() {
  return <PrivacyPolicyPage />;
}
