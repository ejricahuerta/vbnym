import Link from "next/link";
import { Suspense } from "react";

import { CommunityFeedbackForm } from "@/components/community/community-feedback-form";
import { MobileDock } from "@/components/layout/mobile-dock";
import { SiteHeader } from "@/components/layout/site-header";
import { SixBackPageShell, SixBackSection } from "@/components/shared/SixBackPageShell";

export function CommunityHubPage() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <SiteHeader />
      <SixBackPageShell className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">6IX BACK Volleyball</p>
        <SixBackSection
          title="Community Inbox"
          eyebrow="Feedback Loop"
          description="Tell us what is broken, what would make your week easier, or where we should improve the player flow."
          className="mt-4"
        >
          <CommunityFeedbackForm />
        </SixBackSection>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/app" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
            Back to games
          </Link>
        </p>
      </SixBackPageShell>
      <Suspense fallback={null}>
        <MobileDock />
      </Suspense>
    </div>
  );
}
