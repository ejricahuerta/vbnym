import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

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

export function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <SiteHeader />
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "36px 18px 56px" }}>
        <p className="mono" style={{ margin: 0, fontSize: 11, letterSpacing: ".14em", fontWeight: 700, color: "var(--ink-3)" }}>
          6IX BACK VOLLEYBALL
        </p>
        <h1 className="display" style={{ fontSize: "clamp(28px, 7vw, 42px)", margin: "10px 0 0", letterSpacing: "-.03em", color: "var(--ink)" }}>
          Privacy Policy
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 560 }}>
          Effective April 13, 2026. This policy explains what information we collect, why we collect it, and how we protect it.
        </p>

        <Section title="1. Who we are">
          <p style={{ margin: 0 }}>
            6IX BACK Volleyball (&quot;6IX BACK,&quot; &quot;we,&quot; &quot;us&quot;) is a recreational drop-in volleyball program operating in Toronto and the GTA in Ontario, Canada. We operate the website at{" "}
            <span style={{ fontWeight: 700, color: "var(--ink)" }}>vbnym.ednsy.com</span> (the &quot;Site&quot;).
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--ink)" }}>Information you provide</p>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>Registration details </span>
              → your name and email address when you sign up for a game or join a waitlist.
            </li>
            <li style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>Waiver acceptance </span>
              → a record that you accepted the liability waiver, along with a timestamp.
            </li>
            <li style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>Payment confirmation </span>
              → we record receipt of your Interac e-Transfer. We do not store bank-account numbers or financial credentials.
            </li>
            <li style={{ marginBottom: 0 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>Feedback and inquiries </span>
              → any information you submit when you contact us by email or through forms on the Site.
            </li>
          </ul>

          <p style={{ margin: "18px 0 8px", fontWeight: 700, color: "var(--ink)" }}>Information collected automatically</p>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>Cookies </span>
              → we use a small cookie to remember which games you have saved on your device. You can allow or decline cookies when prompted. No tracking or advertising cookies are used.
            </li>
            <li style={{ marginBottom: 0 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>Basic analytics </span>
              → we may collect anonymized usage data (page views, device type) to improve the Site. This data cannot identify you personally.
            </li>
          </ul>
        </Section>

        <Section title="3. How we use your information">
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li style={{ marginBottom: 8 }}>Processing and managing your game registrations.</li>
            <li style={{ marginBottom: 8 }}>
              Sending transactional emails → payment codes, confirmations, waitlist updates, cancellation notices.
            </li>
            <li style={{ marginBottom: 8 }}>Recording your waiver acceptance for legal compliance.</li>
            <li style={{ marginBottom: 8 }}>Responding to feedback or inquiries.</li>
            <li style={{ marginBottom: 12 }}>Improving and maintaining the Site.</li>
          </ul>
          <p style={{ margin: 0 }}>
            We do <span style={{ fontWeight: 700, color: "var(--ink)" }}>not</span> use your information for marketing, advertising, or profiling purposes.
          </p>
        </Section>

        <Section title="4. How we share your information">
          <p style={{ margin: "0 0 12px" }}>We do not sell, rent, or trade your personal information. We may share limited information with:</p>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>Service providers </span>
              → hosting, email delivery, and database services that help us operate the Site. These providers only process data on our behalf and under our instructions.
            </li>
            <li style={{ marginBottom: 0 }}>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>Legal requirements </span>
              → if required by law, regulation, or valid legal process.
            </li>
          </ul>
        </Section>

        <Section title="5. Data retention">
          <p style={{ margin: 0 }}>
            We retain your registration and waiver records for as long as reasonably necessary for legal, operational, and record-keeping purposes. If you would like your data deleted, email Edmel at{" "}
            <a href="mailto:contact@edmel.dev" style={accentLink}>
              contact@edmel.dev
            </a>{" "}
            and we will process your request promptly, subject to any legal obligations to retain certain records.
          </p>
        </Section>

        <Section title="6. Data security">
          <p style={{ margin: 0 }}>
            We use industry-standard measures to protect your information, including encrypted connections (HTTPS) and secure database hosting. However, no method of electronic transmission or storage is 100&nbsp;% secure. We cannot guarantee absolute security but take reasonable steps to protect your data.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p style={{ margin: "0 0 12px" }}>
            The Site uses a single functional cookie to save your selected games to your device. When you first visit, a banner asks whether you would like to allow or decline cookies.
          </p>
          <p style={{ margin: 0 }}>
            If you decline, the &quot;My saved games&quot; feature will not persist between visits, but the rest of the Site will function normally. We do not use third-party tracking cookies.
          </p>
        </Section>

        <Section title="8. Your rights">
          <p style={{ margin: "0 0 12px" }}>Under applicable Canadian and Ontario privacy legislation, you may have the right to:</p>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li style={{ marginBottom: 8 }}>Access the personal information we hold about you.</li>
            <li style={{ marginBottom: 8 }}>Request correction of inaccurate information.</li>
            <li style={{ marginBottom: 8 }}>Request deletion of your personal information (subject to legal retention requirements).</li>
            <li style={{ marginBottom: 12 }}>Withdraw consent to future communications.</li>
          </ul>
          <p style={{ margin: 0 }}>
            To exercise any of these rights, email Edmel at{" "}
            <a href="mailto:contact@edmel.dev" style={accentLink}>
              contact@edmel.dev
            </a>
            .
          </p>
        </Section>

        <Section title="9. Children&apos;s privacy">
          <p style={{ margin: 0 }}>
            Our Site and games are intended for individuals 18 years of age and older. We do not knowingly collect personal information from anyone under 18. If we learn that we have collected information from a minor, we will delete it promptly.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p style={{ margin: 0 }}>
            We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Effective&quot; date at the top of this page. Continued use of the Site after a change constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p style={{ margin: 0 }}>
            If you have questions or concerns about this Privacy Policy, contact Edmel at{" "}
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
