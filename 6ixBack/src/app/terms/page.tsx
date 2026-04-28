import type { Metadata } from "next";

import { TermsOfServicePage } from "@/components/features/legal-terms/TermsOfServicePage";

export const metadata: Metadata = {
  title: "Terms of Service | 6IX BACK Volleyball",
  description:
    "Terms of Service for 6IX BACK Volleyball drop-in games. Read our eligibility, payment, cancellation, and conduct rules.",
};

export default function Page() {
  return <TermsOfServicePage />;
}
