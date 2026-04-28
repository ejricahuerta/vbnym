import Link from "next/link";
import type { CSSProperties } from "react";

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "2px solid var(--ink)", background: "var(--ink)", color: "var(--paper)", marginTop: 60, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "48px 18px 32px", overflow: "hidden" }}>
        <div aria-hidden className="display site-footer-bg-wordmark">
          6IX&nbsp;BACK.
        </div>
        <div
          className="site-footer-columns"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 24,
            alignItems: "start",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <p style={{ maxWidth: 340, color: "rgba(251,248,241,.75)", fontSize: 14, lineHeight: 1.55, margin: "0 0 12px" }}>
              Toronto&apos;s volleyball switchboard. Drop-ins, leagues, tournaments. Built by players, paid by Interac.
            </p>
            <div className="mono" style={{ fontSize: 11, letterSpacing: ".12em", color: "var(--accent)", fontWeight: 700 }}>
              EST. 2026 · TORONTO
            </div>
          </div>
          <FooterColumn title="Play" items={["Drop-ins", "Leagues", "Tournaments", "Skill levels"]} />
          <FooterColumn title="Host" items={["Create a game", "Run a league", "Run a tournament", "Host playbook"]} />
          <FooterColumn
            title="Legal"
            items={[
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Player policies and waiver", href: "/player-policies" },
              { label: "Contact", href: "mailto:contact@edmel.dev" },
            ]}
          />
        </div>
      </div>
      <div
        className="site-footer-bar mono"
        style={{
          borderTop: "1px solid rgba(251,248,241,.2)",
          padding: "14px 18px",
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "rgba(251,248,241,.5)",
          fontSize: 11,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ lineHeight: 1.4 }}>© 2026 6IX BACK VOLLEYBALL CO. · CREATED BY EDMEL RICAHUERTA</span>
        <span style={{ lineHeight: 1.4, textAlign: "right" }}>INTERAC® E-TRANSFER ONLY · NO CARD FEES EVER</span>
      </div>
    </footer>
  );
}

type FooterItem = string | { label: string; href: string };

function FooterColumn({ title, items }: { title: string; items: FooterItem[] }) {
  const linkStyle: CSSProperties = {
    color: "inherit",
    textDecoration: "underline",
    textUnderlineOffset: 3,
    textDecorationColor: "rgba(251,248,241,.35)",
  };

  return (
    <div style={{ minWidth: 0 }}>
      <div
        className="mono"
        style={{
          color: "var(--accent)",
          fontSize: 11,
          letterSpacing: ".14em",
          fontWeight: 700,
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 13,
          color: "rgba(251,248,241,.85)",
          lineHeight: 1.45,
        }}
      >
        {items.map((item) => {
          if (typeof item === "string") {
            return (
              <li key={item}>{item}</li>
            );
          }
          const isMail = item.href.startsWith("mailto:");
          return (
            <li key={item.label}>
              {isMail ? (
                <a href={item.href} style={linkStyle}>
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} style={linkStyle}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
