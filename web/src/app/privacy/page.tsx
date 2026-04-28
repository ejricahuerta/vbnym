import type { Metadata } from "next";

import { PrivacyPolicyPage } from "@/components/features/legal-privacy/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | 6IX BACK Volleyball",
  description:
    "How 6IX BACK Volleyball collects, uses, and protects your personal information when you use our site or register for drop-in games.",
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
