import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 pb-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">6IX BACK Volleyball</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Effective April 13, 2026. By using the 6IX BACK Volleyball website or registering for a drop-in game you agree to
          these terms.
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. About the service</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              6IX BACK Volleyball (&quot;6IX BACK,&quot; &quot;we,&quot; &quot;us&quot;) operates a recreational drop-in
              volleyball program in Toronto and the GTA in Ontario, Canada. We provide a website at{" "}
              <span className="font-medium text-foreground">vbnym.ednsy.com</span> (the &quot;Site&quot;) for browsing
              upcoming games, signing up for spots, and managing your registrations.
            </p>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Site, our email
              communications, and participation in any games we organize. If you do not agree to these Terms, do not use
              the Site or register for any game.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Eligibility</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              You must be at least 18 years old to register for a game. By signing up you represent that you are
              physically capable of participating in recreational volleyball and that you have disclosed any relevant
              medical conditions to your own physician.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Registration and payment</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              When you sign up for a game you receive a time-limited payment code. Payment is by Interac e-Transfer and
              must be completed within the time shown or your registration is automatically cancelled.
            </p>
            <p>
              Waitlisted players who are invited to a spot receive a separate time-limited window to complete payment. If
              that window passes, the spot may be offered to the next player.
            </p>
            <p>
              Full registration-timing, waitlist, cancellation, and refund rules are detailed on our{" "}
              <Link href="/player-policies" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
                Player policies
              </Link>{" "}
              page.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Cancellations and refunds</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              To cancel under our policy, contact us before the cancellation deadline shown in our{" "}
              <Link href="/player-policies" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
                Player policies
              </Link>
              . Late cancellations and no-shows are not eligible for a refund.
            </p>
            <p>
              If we cancel a game (for example, due to facility issues or insufficient signups), registered players will
              receive a full refund.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Liability waiver</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Before your signup is recorded you must accept our{" "}
              <Link href="/player-policies" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
                Liability waiver and release of claims
              </Link>
              . By accepting the waiver you acknowledge the inherent risks of recreational volleyball and agree to the
              release, assumption-of-risk, and indemnification provisions described therein.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Code of conduct</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              All players are expected to behave respectfully toward other participants, organizers, and facility staff.
              We reserve the right to remove any player from a game or ban them from future games → without refund → for
              unsafe, abusive, or disruptive conduct.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Intellectual property</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              All content on the Site → including text, graphics, logos, and software → is the property of 6IX BACK Volleyball
              or its licensors and is protected by applicable intellectual-property laws. You may not copy, reproduce, or
              distribute any Site content without our prior written consent.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">8. Disclaimers</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              The Site and the drop-in program are provided &quot;as is&quot; without warranties of any kind. We do not
              guarantee that games will occur as scheduled or that the Site will be available without interruption.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">9. Limitation of liability</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              To the maximum extent permitted by Ontario law, 6IX BACK Volleyball and its organizers shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your use of the Site or
              participation in any game.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">10. Changes to these Terms</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We may update these Terms from time to time. When we do, we will revise the &quot;Effective&quot; date at
              the top of this page. Continued use of the Site after a change constitutes acceptance of the updated Terms.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">11. Governing law</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              These Terms are governed by the laws of the{" "}
              <span className="font-medium text-foreground">Province of Ontario</span> and the applicable federal laws
              of <span className="font-medium text-foreground">Canada</span>. Any disputes arising under these Terms
              shall be subject to the exclusive jurisdiction of the courts of Ontario.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">12. Contact</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Questions about these Terms? Contact Edmel at{" "}
              <a
                href="mailto:contact@edmel.dev"
                className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80"
              >
                contact@edmel.dev
              </a>
              , or reach out through our{" "}
              <Link href="/community" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
                Community inbox
              </Link>
              .
            </p>
          </div>
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
