import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy | NYM Volleyball",
  description:
    "How North York | Markham Volleyball collects, uses, and protects your personal information when you use our site or register for drop-in games.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 pb-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">North York | Markham Volleyball</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Effective April 13, 2026. This policy explains what information we collect, why we collect it, and how we
          protect it.
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Who we are</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              North York | Markham Volleyball (&quot;NYM,&quot; &quot;we,&quot; &quot;us&quot;) is a recreational drop-in
              volleyball program operating in the North York and Markham areas of Ontario, Canada. We operate the website
              at <span className="font-medium text-foreground">vbnym.ednsy.com</span> (the &quot;Site&quot;).
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Information we collect</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Information you provide</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-foreground">Registration details</span> — your name and email address
                when you sign up for a game or join a waitlist.
              </li>
              <li>
                <span className="font-medium text-foreground">Waiver acceptance</span> — a record that you accepted the
                liability waiver, along with a timestamp.
              </li>
              <li>
                <span className="font-medium text-foreground">Payment confirmation</span> — we record receipt of your
                Interac e-Transfer. We do not store bank-account numbers or financial credentials.
              </li>
              <li>
                <span className="font-medium text-foreground">Feedback &amp; inquiries</span> — any information you
                submit through our Community inbox form.
              </li>
            </ul>

            <p className="mt-4 font-medium text-foreground">Information collected automatically</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-foreground">Cookies</span> — we use a small cookie to remember which
                games you have saved on your device. You can allow or decline cookies when prompted. No tracking or
                advertising cookies are used.
              </li>
              <li>
                <span className="font-medium text-foreground">Basic analytics</span> — we may collect anonymized usage
                data (page views, device type) to improve the Site. This data cannot identify you personally.
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">3. How we use your information</h2>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Processing and managing your game registrations.</li>
              <li>Sending transactional emails — payment codes, confirmations, waitlist updates, cancellation notices.</li>
              <li>Recording your waiver acceptance for legal compliance.</li>
              <li>Responding to feedback or inquiries submitted through the Community inbox.</li>
              <li>Improving and maintaining the Site.</li>
            </ul>
            <p className="mt-3">
              We do <span className="font-medium text-foreground">not</span> use your information for marketing,
              advertising, or profiling purposes.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">4. How we share your information</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>We do not sell, rent, or trade your personal information. We may share limited information with:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-foreground">Service providers</span> — hosting, email delivery, and
                database services that help us operate the Site. These providers only process data on our behalf and under
                our instructions.
              </li>
              <li>
                <span className="font-medium text-foreground">Legal requirements</span> — if required by law,
                regulation, or valid legal process.
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Data retention</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We retain your registration and waiver records for as long as reasonably necessary for legal, operational,
              and record-keeping purposes. If you would like your data deleted, contact us through the{" "}
              <Link href="/community" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
                Community inbox
              </Link>{" "}
              and we will process your request promptly, subject to any legal obligations to retain certain records.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Data security</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We use industry-standard measures to protect your information, including encrypted connections (HTTPS) and
              secure database hosting. However, no method of electronic transmission or storage is 100&nbsp;% secure. We
              cannot guarantee absolute security but take reasonable steps to protect your data.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Cookies</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              The Site uses a single functional cookie to save your selected games to your device. When you first visit,
              a banner asks whether you would like to allow or decline cookies.
            </p>
            <p>
              If you decline, the &quot;My saved games&quot; feature will not persist between visits, but the rest of the
              Site will function normally. We do not use third-party tracking cookies.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">8. Your rights</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Under applicable Canadian and Ontario privacy legislation, you may have the right to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Access the personal information we hold about you.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your personal information (subject to legal retention requirements).</li>
              <li>Withdraw consent to future communications.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us through the{" "}
              <Link href="/community" className="font-medium text-accent underline decoration-accent/50 underline-offset-4 hover:opacity-80">
                Community inbox
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">9. Children&apos;s privacy</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Our Site and games are intended for individuals 18 years of age and older. We do not knowingly collect
              personal information from anyone under 18. If we learn that we have collected information from a minor, we
              will delete it promptly.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">10. Changes to this policy</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Effective&quot;
              date at the top of this page. Continued use of the Site after a change constitutes acceptance of the
              updated policy.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">11. Contact</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              If you have questions or concerns about this Privacy Policy, reach out through our{" "}
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
