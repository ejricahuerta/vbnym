import type { Metadata } from "next";

import { PlayerPoliciesPage } from "@/components/features/legal-player-policies/PlayerPoliciesPage";

export const metadata: Metadata = {
  title: "Player policies and waiver | 6IX BACK Volleyball",
  description:
    "Payment timing, waitlist rules, cancellations, refunds, and the liability waiver for 6IX BACK Volleyball drop-in games.",
};

export default function Page() {
  return <PlayerPoliciesPage />;
}
