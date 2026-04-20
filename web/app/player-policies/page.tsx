import type { Metadata } from "next";

import { PlayerPoliciesPage } from "@/components/features/legal-player-policies/PlayerPoliciesPage";

export const metadata: Metadata = {
  title: "Player policies & waiver | NYM Volleyball",
  description:
    "Payment timing, waitlist rules, cancellations, refunds, and the liability waiver for North York | Markham Volleyball drop-in games.",
};

export default function Page() {
  return <PlayerPoliciesPage />;
}
