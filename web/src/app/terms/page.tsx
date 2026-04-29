import type { Metadata } from "next";

import { TermsOfServicePage } from "@/components/features/legal-terms/TermsOfServicePage";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = buildStaticMetadata({
  title: "Terms of Service | 6IX BACK Volleyball",
  description:
    "Terms of Service for 6IX BACK Volleyball drop-in games. Read our eligibility, payment, cancellation, and conduct rules.",
  pathname: "/terms",
});

export default function Page() {
  return <TermsOfServicePage />;
}
