import Link from "next/link";

import { LiabilityWaiverSection } from "@/components/legal/LiabilityWaiverSection";
import { RegistrationPoliciesSection } from "@/components/legal/RegistrationPoliciesSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SeoJsonLd } from "@/components/shared/SeoJsonLd";
import { buildBreadcrumbSchema, buildLegalWebPageSchema } from "@/lib/seo-schema";

export function PlayerPoliciesPage() {
  const schemaData = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Player policies and waiver", path: "/player-policies" },
    ]),
    buildLegalWebPageSchema({
      title: "Player policies and waiver",
      description:
        "Registration timing, waitlist, cancellation, refund, and liability waiver rules for 6IX BACK Volleyball.",
      path: "/player-policies",
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
          Player policies and waiver
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 560 }}>
          The same terms you see when signing up for a game. Keep this page for your records, or share it with anyone in
          your group.
        </p>

        <section style={{ marginTop: 36, border: "2px solid var(--ink)", borderRadius: 8, background: "var(--paper)", padding: "22px 24px" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>
            Cancellation, payment timing and refunds
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink-3)" }}>
            How holds, waitlist invites, and cancellations work for 6IX BACK drop-in games.
          </p>
          <div style={{ marginTop: 22 }}>
            <RegistrationPoliciesSection />
          </div>
        </section>

        <section style={{ marginTop: 28, border: "2px solid var(--ink)", borderRadius: 8, background: "var(--paper)", padding: "22px 24px" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>
            Liability waiver and release of claims
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink-3)" }}>
            Recreational volleyball drop-in program → Ontario, Canada. You must accept this waiver online before we record
            your signup or waitlist entry.
          </p>
          <div style={{ marginTop: 22 }}>
            <LiabilityWaiverSection />
          </div>
        </section>

        <p style={{ margin: "28px 0 0", textAlign: "center", fontSize: 14 }}>
          <Link href="/browse" style={{ color: "var(--accent-deep)", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 4 }}>
            Browse games
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
