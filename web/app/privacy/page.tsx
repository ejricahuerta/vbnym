import type { Metadata } from "next";

import { PrivacyPolicyPage } from "@/components/features/legal-privacy/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | NYM Volleyball",
  description:
    "How North York | Markham Volleyball collects, uses, and protects your personal information when you use our site or register for drop-in games.",
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
