import Link from "next/link";

import { LiabilityWaiverSection } from "@/components/legal/liability-waiver-section";
import { RegistrationPoliciesSection } from "@/components/legal/registration-policies-section";
import { SiteHeader } from "@/components/layout/site-header";

export function PlayerPoliciesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 pb-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">6IX BACK Volleyball</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground">Player policies and waiver</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The same terms you see when signing up for a game. Keep this page for your records, or share it with anyone
          in your group.
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Cancellation, payment timing and refunds</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            How holds, waitlist invites, and cancellations work for 6IX BACK drop-in games.
          </p>
          <RegistrationPoliciesSection className="mt-6" />
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Liability waiver and release of claims</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Recreational volleyball drop-in program → Ontario, Canada. You must accept this waiver online before we
            record your signup or waitlist entry.
          </p>
          <LiabilityWaiverSection className="mt-6" />
        </section>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
            Back to games
          </Link>
        </p>
      </main>
    </div>
  );
}
