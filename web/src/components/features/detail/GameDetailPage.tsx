import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SeoJsonLd } from "@/components/shared/SeoJsonLd";
import { SignupForm } from "@/components/features/detail/SignupForm";
import { KindBadge } from "@/components/shared/UiPrimitives";
import { COMING_SOON_LABEL, isGameKindComingSoon } from "@/lib/game-kind-availability";
import { gameOrganizationDisplayName } from "@/lib/game-organization";
import { buildBreadcrumbSchema, buildGameEventSchema } from "@/lib/seo-schema";
import { getHostSessionEmail } from "@/lib/auth";
import { getGameWithRoster } from "@/server/queries/games";

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}

function formatGameRange(iso: string, durationMinutes: number): string {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const o: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  return `${start.toLocaleTimeString("en-CA", o)} – ${end.toLocaleTimeString("en-CA", o)}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DetailIconCalendar() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DetailIconMapPin() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function DetailIconUser() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 20c1.8-4 12.2-4 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export async function GameDetailPage({ gameId }: { gameId: string }) {
  const [data, hostSessionEmail] = await Promise.all([getGameWithRoster(gameId), getHostSessionEmail()]);
  if (!data) notFound();

  const { game, roster } = data;
  const organizerName = gameOrganizationDisplayName(game);
  const scheduleForSignup =
    game.kind === "dropin"
      ? `${formatDay(game.starts_at)} · ${formatGameRange(game.starts_at, game.duration_minutes)}`
      : formatDay(game.starts_at);
  const isHostForThisGame =
    hostSessionEmail != null &&
    game.owner_email.trim().toLowerCase() === hostSessionEmail.trim().toLowerCase();
  const dark = game.kind === "league";
  const comingSoonKind = isGameKindComingSoon(game.kind);
  const venueLine = [game.venue_name, game.venue_area].filter(Boolean).join(", ");
  const formatLead = game.notes?.trim() || "Co-ed 6s";
  const formatParagraph = `${formatLead}${formatLead.endsWith(".") ? "" : "."} Show up 10 minutes early. Captains pick balanced teams. We rotate every 25 minutes.`;
  const rosterPreview = roster.slice(0, 8);
  const moreCount = Math.max(roster.length - 8, 0);

  const fg = dark ? "var(--paper)" : "var(--ink)";
  const fgMuted = dark ? "rgba(251,248,241,.85)" : "var(--ink-2)";
  const chipOutline = dark
    ? { borderColor: "var(--paper)", color: "var(--paper)" }
    : {};
  const schemaData = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Browse", path: "/browse" },
      { name: game.title, path: `/games/${game.id}` },
    ]),
    buildGameEventSchema(game),
  ];

  return (
    <div>
      <SeoJsonLd data={schemaData} />
      <SiteHeader />
      <section
        style={{
          borderBottom: "2px solid var(--ink)",
          background: dark ? "var(--ink)" : "var(--bg)",
          color: fg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 18px 12px", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/browse"
            className="mono"
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              opacity: 0.7,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "inherit",
            }}
          >
            ← BACK TO SCHEDULE
          </Link>
          {isHostForThisGame ? (
            <Link
              href="/host"
              className="mono"
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                opacity: 0.7,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "inherit",
              }}
            >
              HOST DASHBOARD →
            </Link>
          ) : null}
          {!isHostForThisGame && !comingSoonKind ? (
            <Link
              href={`/host/request?game=${encodeURIComponent(game.id)}`}
              className="mono"
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                opacity: 0.7,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "inherit",
              }}
            >
              REQUEST HOST ACCESS →
            </Link>
          ) : null}
        </div>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "8px 18px 40px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 32,
          }}
          className="detail-hero-grid"
        >
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <KindBadge kind={game.kind} invert={dark} />
              <span className="chip outline" style={chipOutline}>
                {game.skill_level}
              </span>
              <span className="chip outline" style={chipOutline}>
                CO-ED 6S
              </span>
            </div>
            <h1 className="display" style={{ fontSize: "clamp(36px, 7vw, 80px)", margin: "0 0 14px", lineHeight: 0.92, letterSpacing: "-.03em", color: fg }}>
              {game.title}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px", fontSize: 14, opacity: 0.85, color: fgMuted }}>
              <div>
                <strong>{formatDay(game.starts_at)}</strong>
                {game.kind === "dropin" ? ` · ${formatGameRange(game.starts_at, game.duration_minutes)}` : null}
              </div>
              <div>{venueLine}</div>
              <div>Organizer · {organizerName}</div>
              <div>Host · {game.host_name}</div>
            </div>
          </div>
          <div>
            {comingSoonKind ? (
              <div className="card" style={{ padding: 16, border: "2px solid var(--ink)", background: "var(--paper)" }}>
                <div className="chip warn" style={{ marginBottom: 10 }}>
                  {COMING_SOON_LABEL}
                </div>
                <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  League and Tournament signups are not open yet. Drop-in games are currently live.
                </p>
              </div>
            ) : (
              <SignupForm
                gameId={game.id}
                priceCents={game.price_cents}
                signedCount={game.signed_count}
                capacity={game.capacity}
                hostName={game.host_name}
                hostEmail={game.host_email}
                gameTitle={game.title}
                startsAtDisplay={scheduleForSignup}
                kind={game.kind}
              />
            )}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }} className="detail-body-grid">
          <div>
            <div className="label">Format</div>
            <p style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 24px", maxWidth: 680, color: "var(--ink-2)" }}>
              {formatParagraph}
            </p>
            <div className="label">What to bring</div>
            <ul style={{ paddingLeft: 18, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7, margin: "0 0 24px" }}>
              <li>Indoor court shoes (non-marking)</li>
              <li>Water fountain on site</li>
              <li>Knee pads if you&apos;ve got them</li>
              <li>A light + dark shirt for team mixing</li>
            </ul>
            <div className="label">Your host</div>
            <div className="card" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: "2px solid var(--ink)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: 18,
                  fontFamily: "var(--display)",
                  flexShrink: 0,
                }}
              >
                {initials(game.host_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{game.host_name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".08em", fontWeight: 700 }}>
                  ★ 4.9 · 62 GAMES RUN
                </div>
              </div>
              <button type="button" className="btn sm ghost">
                Message
              </button>
            </div>
          </div>
          <div>
            <div className="label">Roster · {roster.length}</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {roster.length === 0 ? (
                <div style={{ padding: 14, fontSize: 13, color: "var(--ink-2)" }}>No one yet.</div>
              ) : (
                <>
                  {rosterPreview.map((row, index) => (
                    <div
                      key={row.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        borderBottom: index === rosterPreview.length - 1 && moreCount === 0 ? "none" : "1px dashed var(--ink-3)",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "var(--bg)",
                          border: "1.5px solid var(--ink)",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 900,
                          fontSize: 11,
                          fontFamily: "var(--display)",
                          flexShrink: 0,
                        }}
                      >
                        {initials(row.player_name)}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{row.player_name}</div>
                    </div>
                  ))}
                  {moreCount > 0 ? (
                    <div
                      className="mono"
                      style={{
                        padding: "12px 14px",
                        textAlign: "center",
                        fontSize: 11,
                        color: "var(--ink-3)",
                        background: "var(--bg)",
                        letterSpacing: ".12em",
                        fontWeight: 700,
                      }}
                    >
                      + {moreCount} MORE
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
