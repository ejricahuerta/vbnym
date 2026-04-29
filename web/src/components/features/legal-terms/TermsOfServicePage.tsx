import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SeoJsonLd } from "@/components/shared/SeoJsonLd";
import { buildBreadcrumbSchema, buildLegalWebPageSchema } from "@/lib/seo-schema";

const accentLink: CSSProperties = {
  color: "var(--accent-deep)",
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: 4,
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 28, border: "2px solid var(--ink)", borderRadius: 8, background: "var(--paper)", padding: "22px 24px" }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>{title}</h2>
      <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>{children}</div>
    </section>
  );
}

export function TermsOfServicePage() {
  const schemaData = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Terms of Service", path: "/terms" },
    ]),
    buildLegalWebPageSchema({
      title: "Terms of Service",
      description:
        "Terms governing use of 6IX BACK Volleyball services, registrations, payments, and player conduct.",
      path: "/terms",
      effectiveDate: "2026-04-13",
    }),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SeoJsonLd data={schemaData} />
      <SiteHeader />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "36px 18px 56px" }}>
        <p className="mono" style={{ margin: 0, fontSize: 11, letterSpacing: ".14em", fontWeight: 700, color: "var(--ink-3)" }}>
          6IX BACK VOLLEYBALL
        </p>
        <h1 className="display" style={{ fontSize: "clamp(28px, 7vw, 42px)", margin: "10px 0 0", letterSpacing: "-.03em", color: "var(--ink)" }}>
          Terms of Service
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 560 }}>
          Effective April 13, 2026. By using the 6IX BACK Volleyball website or registering for a drop-in game you agree to
          these terms.
        </p>

        <Section title="1. About the service">
          <p style={{ margin: "0 0 12px" }}>
            6IX BACK Volleyball (&quot;6IX BACK,&quot; &quot;we,&quot; &quot;us&quot;) operates a recreational drop-in volleyball program in Toronto and the GTA in Ontario, Canada. We provide a website at{" "}
            <span style={{ fontWeight: 700, color: "var(--ink)" }}>vbnym.ednsy.com</span> (the &quot;Site&quot;) for browsing upcoming games, signing up for spots, and managing your registrations.
          </p>
          <p style={{ margin: 0 }}>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Site, our email communications, and participation in any games we organize. If you do not agree to these Terms, do not use the Site or register for any game.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p style={{ margin: 0 }}>
            You must be at least 18 years old to register for a game. By signing up you represent that you are physically capable of participating in recreational volleyball and that you have disclosed any relevant medical conditions to your own physician.
          </p>
        </Section>

        <Section title="3. Registration and payment">
          <p style={{ margin: "0 0 12px" }}>
            When you sign up for a game you receive a time-limited payment code. Payment is by Interac e-Transfer and must be completed within the time shown or your registration is automatically cancelled.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            Waitlisted players who are invited to a spot receive a separate time-limited window to complete payment. If that window passes, the spot may be offered to the next player.
          </p>
          <p style={{ margin: 0 }}>
            Full registration-timing, waitlist, cancellation, and refund rules are detailed on our{" "}
            <Link href="/player-policies" style={accentLink}>
              Player policies
            </Link>{" "}
            page.
          </p>
        </Section>

        <Section title="4. Cancellations and refunds">
          <p style={{ margin: "0 0 12px" }}>
            To cancel under our policy, contact us before the cancellation deadline shown in our{" "}
            <Link href="/player-policies" style={accentLink}>
              Player policies
            </Link>
            . Late cancellations and no-shows are not eligible for a refund.
          </p>
          <p style={{ margin: 0 }}>
            If we cancel a game (for example, due to facility issues or insufficient signups), registered players will receive a full refund.
          </p>
        </Section>

        <Section title="5. Liability waiver">
          <p style={{ margin: 0 }}>
            Before your signup is recorded you must accept our{" "}
            <Link href="/player-policies" style={accentLink}>
              Liability waiver and release of claims
            </Link>
            . By accepting the waiver you acknowledge the inherent risks of recreational volleyball and agree to the release, assumption-of-risk, and indemnification provisions described therein.
          </p>
        </Section>

        <Section title="6. Code of conduct">
          <p style={{ margin: 0 }}>
            All players are expected to behave respectfully toward other participants, organizers, and facility staff. We reserve the right to remove any player from a game or ban them from future games → without refund → for unsafe, abusive, or disruptive conduct.
          </p>
        </Section>

        <Section title="7. Intellectual property">
          <p style={{ margin: 0 }}>
            All content on the Site → including text, graphics, logos, and software → is the property of 6IX BACK Volleyball or its licensors and is protected by applicable intellectual-property laws. You may not copy, reproduce, or distribute any Site content without our prior written consent.
          </p>
        </Section>

        <Section title="8. Disclaimers">
          <p style={{ margin: 0 }}>
            The Site and the drop-in program are provided &quot;as is&quot; without warranties of any kind. We do not guarantee that games will occur as scheduled or that the Site will be available without interruption.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p style={{ margin: 0 }}>
            To the maximum extent permitted by Ontario law, 6IX BACK Volleyball and its organizers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Site or participation in any game.
          </p>
        </Section>

        <Section title="10. Changes to these Terms">
          <p style={{ margin: 0 }}>
            We may update these Terms from time to time. When we do, we will revise the &quot;Effective&quot; date at the top of this page. Continued use of the Site after a change constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p style={{ margin: 0 }}>
            These Terms are governed by the laws of the <span style={{ fontWeight: 700, color: "var(--ink)" }}>Province of Ontario</span> and the applicable federal laws of{" "}
            <span style={{ fontWeight: 700, color: "var(--ink)" }}>Canada</span>. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Ontario.
          </p>
        </Section>

        <Section title="12. Contact">
          <p style={{ margin: 0 }}>
            Questions about these Terms? Contact Edmel at{" "}
            <a href="mailto:contact@edmel.dev" style={accentLink}>
              contact@edmel.dev
            </a>
            .
          </p>
        </Section>

        <p style={{ margin: "28px 0 0", textAlign: "center", fontSize: 14, color: "var(--ink-2)" }}>
          <Link href="/browse" style={accentLink}>
            Browse games
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
