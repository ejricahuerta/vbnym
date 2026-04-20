import type { Metadata } from "next";

import { TermsOfServicePage } from "@/components/features/legal-terms/TermsOfServicePage";

export const metadata: Metadata = {
  title: "Terms of Service | NYM Volleyball",
  description:
    "Terms of Service for North York | Markham Volleyball drop-in games. Read our eligibility, payment, cancellation, and conduct rules.",
};

export default function Page() {
  return <TermsOfServicePage />;
}
