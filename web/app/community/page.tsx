import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileDock } from "@/components/layout/mobile-dock";
import { CommunityFeedbackForm } from "@/components/community/community-feedback-form";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Community & feedback | NYM Volleyball",
  description:
    "Report bugs, suggest features, ask about sponsoring or hosting a game, or reach out about advertising. Help us improve North York | Markham Volleyball.",
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">North York | Markham Volleyball</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground">Community inbox</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This app exists for the community. Tell us what is broken, what would make your week easier, or how you would
          like to partner with the league. We read everything and reply when an email is the right next step.
        </p>

        <div className="mt-8">
          <CommunityFeedbackForm />
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
            Back to games
          </Link>
        </p>
      </main>
      <Suspense fallback={null}>
        <MobileDock />
      </Suspense>
    </div>
  );
}
