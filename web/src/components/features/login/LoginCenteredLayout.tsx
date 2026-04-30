import Link from "next/link";
import type { ReactNode } from "react";

type FooterLink = {
  label: string;
  href: string;
  prefix?: string;
};

export function LoginCenteredLayout({
  leftEyebrow,
  leftTitle,
  leftAccent,
  leftDescription,
  leftLinks,
  rightTitle,
  children,
}: {
  leftEyebrow: ReactNode;
  leftTitle: string;
  leftAccent: string;
  leftDescription?: string;
  leftLinks?: FooterLink[];
  rightTitle?: string;
  children: ReactNode;
}) {
  const links = leftLinks ?? [];
  return (
    <main className="login-page-shell">
      <div className="login-shell-inner">
        <header>
          <div className="label login-shell-eyebrow">{leftEyebrow}</div>

          <h1
            className="display"
            style={{
              fontSize: "clamp(28px, 8vw, 52px)",
              margin: "12px 0 0",
              letterSpacing: "-.04em",
            }}
          >
            {leftTitle}{" "}
            <span className="serif-display" style={{ fontStyle: "italic", textTransform: "lowercase", color: "var(--accent)" }}>
              {leftAccent}
            </span>
          </h1>

          {leftDescription ? <p className="login-shell-lede">{leftDescription}</p> : null}
        </header>

        <section aria-labelledby="login-card-heading" className="card login-shell-card motion-sheet-panel">
          <h2
            id="login-card-heading"
            className={rightTitle ? "display login-shell-card-title" : "sr-only login-shell-card-title"}
          >
            {rightTitle ?? "Sign in"}
          </h2>
          {children}
        </section>

        {links.length > 0 ? (
          <nav aria-label="Other sign-in options" className="login-shell-footer">
            {links.map((item) => (
              <p key={`${item.label}-${item.href}`}>
                {item.prefix ? `${item.prefix} ` : ""}
                <Link href={item.href}>{item.label}</Link>
              </p>
            ))}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
