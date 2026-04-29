import Link from "next/link";
import { Fragment } from "react";

import { getFacilitySpotlights } from "@/server/queries/facility-spotlights";
import { listLiveGames } from "@/server/queries/games";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SeoJsonLd } from "@/components/shared/SeoJsonLd";
import { DayStamp, KindBadge, SkillDots } from "@/components/shared/UiPrimitives";
import { buildBreadcrumbSchema, buildOrganizationSchema, buildWebsiteSchema } from "@/lib/seo-schema";

import type { GameRow, SignupRow } from "@/types/domain";

import { LandingFacilitiesSection } from "./LandingFacilitiesSection";

function CourtHeroBg() {
  return (
    <svg viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet" aria-hidden style={{ width: "100%", height: "100%" }}>
      <rect x="10" y="10" width="580" height="300" fill="none" stroke="var(--paper)" strokeOpacity={0.15} strokeWidth="1" strokeDasharray="3 5" />
      <rect x="60" y="40" width="480" height="240" fill="none" stroke="var(--paper)" strokeOpacity={0.35} strokeWidth="3" />
      <line x1="300" y1="40" x2="300" y2="280" stroke="var(--paper)" strokeOpacity={0.35} strokeWidth="3" />
      <circle cx="300" cy="40" r="3" fill="var(--paper)" fillOpacity={0.35} />
      <circle cx="300" cy="280" r="3" fill="var(--paper)" fillOpacity={0.35} />
      <g stroke="var(--paper)" strokeOpacity={0.2} strokeWidth="0.6">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={295} y1={48 + i * 17} x2={305} y2={48 + i * 17} />
        ))}
      </g>
      <line x1="220" y1="40" x2="220" y2="280" stroke="var(--paper)" strokeOpacity={0.35} strokeWidth="2" />
      <line x1="380" y1="40" x2="380" y2="280" stroke="var(--paper)" strokeOpacity={0.35} strokeWidth="2" />
    </svg>
  );
}

function formatGameRange(iso: string, durationMinutes: number): string {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const o: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  return `${start.toLocaleTimeString("en-CA", o)} – ${end.toLocaleTimeString("en-CA", o)}`;
}

const MARQUEE_ITEMS = [
  "★ DROP-INS ALL WEEK",
  "★ INTERAC ONLY",
  "★ NO CARD FEES",
  "★ CO-ED 6S",
];

/** Static preview for the “For hosts” roster card (not tied to live DB sign-ups). */
const LANDING_HOST_SAMPLE_HEADER: Pick<GameRow, "title" | "signed_count" | "capacity"> = {
  title: "Wed Co-ed 6s · North York CC",
  signed_count: 10,
  capacity: 12,
};

/** Shown in the hero when there are no live games yet (illustrative ticket). */
const LANDING_DUMMY_HERO_TICKET: Pick<
  GameRow,
  "id" | "kind" | "title" | "venue_name" | "starts_at" | "duration_minutes" | "capacity" | "signed_count" | "price_cents"
> = {
  id: "00000000-4000-8000-8000-000000000001",
  kind: "dropin",
  title: "Wed Co-ed 6s · North York",
  venue_name: "North York CC",
  starts_at: "2026-05-06T23:30:00.000Z",
  duration_minutes: 120,
  capacity: 12,
  signed_count: 8,
  price_cents: 2500,
};

function gameKindTicketLabel(kind: GameRow["kind"]): string {
  if (kind === "league") return "LEAGUE";
  if (kind === "tournament") return "EVENT";
  return "DROP-IN";
}

const LANDING_HOST_SAMPLE_ROSTER: SignupRow[] = [
  {
    id: "landing-host-sample-1",
    game_id: "landing-host-sample",
    player_name: "Alex Chen",
    player_email: "alex.chen@example.com",
    payment_code: "6IX-K7M2",
    payment_status: "paid",
    status: "active",
    created_at: "2026-04-21T14:22:00.000Z",
  },
  {
    id: "landing-host-sample-2",
    game_id: "landing-host-sample",
    player_name: "Jordan Singh",
    player_email: "jordan.singh@example.com",
    payment_code: "6IX-P9R4",
    payment_status: "paid",
    status: "active",
    created_at: "2026-04-21T15:01:00.000Z",
  },
  {
    id: "landing-host-sample-3",
    game_id: "landing-host-sample",
    player_name: "Sam Okonkwo",
    player_email: "sam.okonkwo@example.com",
    payment_code: "6IX-T3N8",
    payment_status: "sent",
    status: "active",
    created_at: "2026-04-22T09:45:00.000Z",
  },
  {
    id: "landing-host-sample-4",
    game_id: "landing-host-sample",
    player_name: "Priya N.",
    player_email: "priya.n@example.com",
    payment_code: "6IX-W5L1",
    payment_status: "paid",
    status: "active",
    created_at: "2026-04-22T11:12:00.000Z",
  },
  {
    id: "landing-host-sample-5",
    game_id: "landing-host-sample",
    player_name: "Marcus Lee",
    player_email: "marcus.lee@example.com",
    payment_code: "6IX-Z8Q6",
    payment_status: "owes",
    status: "active",
    created_at: "2026-04-23T18:30:00.000Z",
  },
  {
    id: "landing-host-sample-6",
    game_id: "landing-host-sample",
    player_name: "Taylor Brooks",
    player_email: "taylor.brooks@example.com",
    payment_code: "6IX-B2Y0",
    payment_status: "owes",
    status: "active",
    created_at: "2026-04-24T08:05:00.000Z",
  },
];

function WeekPreviewCard({ game }: { game: GameRow }) {
  const spots = Math.max(game.capacity - game.signed_count, 0);
  const full = game.signed_count >= game.capacity;
  const almost = !full && spots <= 4 && spots > 0;

  if (game.kind === "league") {
    return (
      <Link href={`/games/${game.id}`} className="liftable" style={{ display: "block", textAlign: "left" }}>
        <div className="card dark" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "2px solid var(--paper)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <KindBadge kind="league" invert />
            <span className="chip outline" style={{ borderColor: "var(--paper)", color: "var(--paper)" }}>
              8 WEEKS
            </span>
          </div>
          <div style={{ padding: 18 }}>
            <h3 className="display" style={{ fontSize: 24, margin: "0 0 12px", color: "var(--accent)", lineHeight: 0.95, letterSpacing: "-.02em" }}>
              {game.title}
            </h3>
            <div style={{ fontSize: 13, color: "rgba(251,248,241,.7)", marginBottom: 14 }}>
              {game.venue_name}
              {" "}
              → Starts{" "}
              {new Date(game.starts_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(251,248,241,.85)", marginBottom: 18 }}>
              <SkillDots level={game.skill_level} invert />
              <span className="mono" style={{ letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600 }}>
                {game.skill_level}
              </span>
            </div>
            <div style={{ borderTop: "2px dashed rgba(251,248,241,.3)", paddingTop: 14, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: "rgba(251,248,241,.5)", letterSpacing: ".14em", fontWeight: 700 }}>
                  TEAMS
                </div>
                <div className="display" style={{ fontSize: 22, color: "var(--paper)" }}>
                  {game.signed_count}/{game.capacity}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 9, color: "rgba(251,248,241,.5)", letterSpacing: ".14em", fontWeight: 700 }}>
                  PER TEAM
                </div>
                <div className="display" style={{ fontSize: 22, color: "var(--accent)" }}>
                  ${(game.price_cents / 100).toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (game.kind === "tournament") {
    const d = new Date(game.starts_at);
    const big = d.getDate();
    const dow = d.toLocaleDateString("en-CA", { weekday: "short" }).toUpperCase();
    const mon = d.toLocaleDateString("en-CA", { month: "short" }).toUpperCase();
    return (
      <Link href={`/games/${game.id}`} className="liftable" style={{ display: "block", textAlign: "left" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden", background: "var(--paper)" }}>
          <div style={{ padding: "10px 14px", borderBottom: "2px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)" }}>
            <KindBadge kind="tournament" />
            <span className="chip gold">PRIZE POOL</span>
          </div>
          <div style={{ padding: 18, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 10 }}>
              <div className="display" style={{ fontSize: 72, lineHeight: 0.85, letterSpacing: "-.04em" }}>
                {big}
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", fontWeight: 700 }}>
                  {dow} · {mon}
                </div>
              </div>
            </div>
            <h3 className="display" style={{ fontSize: 24, margin: "0 0 8px", letterSpacing: "-.02em" }}>
              {game.title}
            </h3>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 14 }}>
              {game.venue_name}
              {game.notes ? ` · ${game.notes}` : ""}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "2px dashed var(--ink)", paddingTop: 12 }}>
              <div className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em" }}>
                {game.signed_count}/{game.capacity} TEAMS
              </div>
              <span className="display" style={{ fontSize: 20 }}>
                ${(game.price_cents / 100).toFixed(0)}/team
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/games/${game.id}`} className="liftable" style={{ display: "block", textAlign: "left" }}>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "var(--accent)", borderBottom: "2px solid var(--ink)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <KindBadge kind="dropin" />
          {full ? (
            <span className="chip">WAIT-LIST</span>
          ) : almost ? (
            <span className="chip warn">
              {spots} LEFT
            </span>
          ) : (
            <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", fontWeight: 700 }}>
              OPEN
            </span>
          )}
        </div>
        <div style={{ padding: 18, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <DayStamp iso={game.starts_at} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="display" style={{ fontSize: 21, margin: "0 0 6px", letterSpacing: "-.02em" }}>
              {game.title}
            </h3>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginBottom: 6, lineHeight: 1.5 }}>
              <div>
                {game.venue_name}
                {game.venue_area ? ` → ${game.venue_area}` : ""}
              </div>
              <div className="mono" style={{ marginTop: 4 }}>{formatGameRange(game.starts_at, game.duration_minutes)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--ink-2)" }}>
              <SkillDots level={game.skill_level} />
              <span className="mono" style={{ letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600 }}>{game.skill_level}</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "2px dashed var(--ink)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)" }}>
          <div className="mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em" }}>
            {game.signed_count}/{game.capacity} SIGNED
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span className="display" style={{ fontSize: 20 }}>
              ${(game.price_cents / 100).toFixed(0)}
            </span>
            <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: ".14em", fontWeight: 700 }}>
              INTERAC
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export async function LandingPage() {
  const [games, facilities] = await Promise.all([listLiveGames(), getFacilitySpotlights()]);
  const heroGame = games[0];
  const ticketGame = heroGame ?? LANDING_DUMMY_HERO_TICKET;
  const spotsLeftTicket = Math.max(ticketGame.capacity - ticketGame.signed_count, 0);
  const heroTicketHref = heroGame ? `/games/${heroGame.id}` : "/browse";
  const heroTicketMeta = heroGame
    ? `${ticketGame.id.replace(/-/g, "").slice(0, 8).toUpperCase()} · ${gameKindTicketLabel(ticketGame.kind)}`
    : "SAMPLE · DROP-IN";
  const dropins = games.filter((g) => g.kind === "dropin");
  const weekGames = dropins.length >= 3 ? dropins.slice(0, 3) : games.slice(0, 3);

  const leagueCount = games.filter((g) => g.kind === "league").length;
  const dropinCount = games.filter((g) => g.kind === "dropin").length;
  const tournamentCount = games.filter((g) => g.kind === "tournament").length;
  const totalFilledSpots = games.reduce((acc, g) => acc + g.signed_count, 0);
  const heroKpis = [
    { n: String(games.length), l: "Live games" },
    { n: String(totalFilledSpots), l: "Spots filled" },
    { n: String(leagueCount), l: "League posts" },
    { n: "$0", l: "Platform booking fees" },
  ] as const;

  const heroSubtitle =
    games.length === 0
      ? "Browse and host games across Toronto. Interac-only. Tap in."
      : `${dropinCount} drop-in${dropinCount === 1 ? "" : "s"}, ${leagueCount} league${leagueCount === 1 ? "" : "s"}, ${tournamentCount} tournament${tournamentCount === 1 ? "" : "s"} on the board. All Interac. All Toronto. Tap in.`;

  const hostPreviewGame = LANDING_HOST_SAMPLE_HEADER;
  const hostPreviewRows = LANDING_HOST_SAMPLE_ROSTER;
  const hostPreviewPaid = LANDING_HOST_SAMPLE_ROSTER.filter((r) => r.payment_status === "paid").length;
  const schemaData = [buildOrganizationSchema(), buildWebsiteSchema(), buildBreadcrumbSchema([{ name: "Home", path: "/" }])];

  return (
    <div>
      <SeoJsonLd data={schemaData} />
      <SiteHeader />
      <section className="landing-hero-section" style={{ background: "var(--ink)", color: "var(--paper)", borderBottom: "2px solid var(--ink)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, pointerEvents: "none" }}>
          <CourtHeroBg />
        </div>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 18px 44px", position: "relative" }}>
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32, alignItems: "center", position: "relative" }}>
          <div className="landing-hero-copy">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              <span className="pill solid live">Toronto &amp; GTA</span>
            </div>
            <h1 className="display landing-text-rise" style={{ fontSize: "clamp(56px, 12vw, 144px)", margin: "0 0 16px", lineHeight: 0.85, letterSpacing: "-.04em", color: "var(--paper)" }}>
              Get on
              <br />
              the <span style={{ color: "var(--accent)" }}>court.</span>
            </h1>
            <p className="landing-text-fade" style={{ maxWidth: 520, color: "rgba(251,248,241,.75)", lineHeight: 1.5, fontSize: "clamp(15px, 2vw, 18px)", margin: "0 0 24px" }}>
              {heroSubtitle}
            </p>
            <div className="landing-hero-cta" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/browse" className="btn lg accent">
                Browse schedule
              </Link>
              <Link href="/host/new" className="btn lg invert">
                Host a game
              </Link>
            </div>
          </div>
          <Link
            href={heroTicketHref}
            className="liftable landing-hero-ticket"
            aria-label={heroGame ? `${ticketGame.title} → view game` : "Sample ticket → browse games"}
            style={{
              display: "block",
              background: "var(--paper)",
              color: "var(--ink)",
              borderRadius: 10,
              position: "relative",
              border: "2px solid var(--ink)",
              boxShadow: "8px 8px 0 var(--accent), 12px 12px 0 var(--paper), 16px 16px 0 0 rgba(0,0,0,.4)",
              transform: "rotate(-1.5deg)",
              textDecoration: "none",
            }}
          >
            <div style={{ position: "absolute", left: -9, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", background: "var(--ink)", border: "2px solid var(--ink)" }} />
            <div style={{ position: "absolute", right: -9, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", background: "var(--ink)", border: "2px solid var(--ink)" }} />
            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span className="display" style={{ fontSize: 14, letterSpacing: "-.02em", lineHeight: 1 }}>
                6IX BACK
              </span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", fontWeight: 700 }}>
                {heroTicketMeta}
              </span>
            </div>
            <div style={{ borderTop: "2px dashed var(--ink)", borderBottom: "2px dashed var(--ink)", padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
              <DayStamp iso={ticketGame.starts_at} size="lg" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="display" style={{ fontSize: 22, margin: "0 0 4px", letterSpacing: "-.02em" }}>
                  {ticketGame.title}
                </h3>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 6 }}>{ticketGame.venue_name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)", letterSpacing: ".06em" }}>
                  {formatGameRange(ticketGame.starts_at, ticketGame.duration_minutes)}
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "var(--ink-3)", fontWeight: 700 }}>
                  SPOTS LEFT
                </div>
                <div className="display" style={{ fontSize: 24 }}>
                  {spotsLeftTicket}
                  <span style={{ color: "var(--ink-3)", fontSize: 14 }}>/{ticketGame.capacity}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "var(--ink-3)", fontWeight: 700 }}>
                  INTERAC
                </div>
                <div className="display" style={{ fontSize: 24, color: "var(--ink)" }}>${(ticketGame.price_cents / 100).toFixed(0)}</div>
              </div>
            </div>
          </Link>
          </div>
          <div
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
            }}
            className="stats-strip-grid landing-hero-kpi-strip"
          >
            {heroKpis.map((s, i) => (
              <div
                key={s.l}
                className="landing-stat-item"
                style={{
                  borderTop: "4px solid var(--accent)",
                  paddingTop: 14,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div
                  className="display"
                  style={{
                    fontSize: "clamp(28px, 5vw, 48px)",
                    lineHeight: 0.9,
                    letterSpacing: "-.03em",
                    color: "var(--paper)",
                  }}
                >
                  {s.n}
                </div>
                <div
                  className="mono"
                  style={{
                    marginTop: 8,
                    marginBottom: 0,
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "rgba(251,248,241,.55)",
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section-fade" style={{ borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)", background: "var(--accent)", overflow: "hidden", padding: "12px 0" }}>
        <div className="marquee-wrap">
          <div className="marquee-track display" style={{ fontWeight: 900, fontSize: "clamp(20px, 3vw, 30px)", letterSpacing: "-.01em" }}>
            {[0, 1].map((copy) => (
              <Fragment key={copy}>
                {MARQUEE_ITEMS.map((text) => (
                  <span key={`${copy}-${text}`}>{text}</span>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section-fade" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="label" style={{ marginBottom: 10 }}>
              How it works
            </div>
            <h2 className="display landing-text-rise" style={{ fontSize: "clamp(38px, 7vw, 80px)", margin: 0, maxWidth: 780, letterSpacing: "-.03em" }}>
              Find a game.
              <br />
              Pay your captain.
              <br />
              <span className="scribble">Just play.</span>
            </h2>
          </div>
          <div className="landing-text-fade" style={{ maxWidth: 380, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55 }}>
            <p style={{ margin: 0 }}>
              We don&apos;t take a cut. Hosts receive payment by Interac e-Transfer → exactly how Toronto already pays. Zero card fees, ever.
            </p>
            <p style={{ margin: "12px 0 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 10px" }}>
              <span>
                If you&apos;d like to help keep the platform going, optional Interac e-Transfers are deeply appreciated.
              </span>
              <a href="#support-the-platform" className="btn sm" aria-label="Support the platform: Interac details">
                here
              </a>
            </p>
          </div>
        </div>
        <div className="landing-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { id: "browse", h: "Browse the schedule", b: "Filter by night, neighbourhood, skill, or format. Every drop-in, league, and tournament in the city." },
            { id: "reserve", h: "Reserve your spot", b: "Hit Sign Up. We generate a unique payment reference and copy-ready Interac request to your host." },
            { id: "play", h: "Show up, hit balls", b: "We auto-match your reference code from the Interac message → usually within a minute. Your spot turns green. No invoices. No fees." },
          ].map((s, i) => (
            <div key={s.id} className="card liftable landing-step-card" style={{ padding: 24, background: i === 1 ? "var(--accent)" : "var(--paper)" }}>
            <h3 className="display landing-card-title" style={{ margin: "0 0 10px", fontSize: 24, letterSpacing: "-.02em" }}>
                {s.h}
              </h3>
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section-fade" style={{ background: "var(--ink)", color: "var(--paper)", borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none" }}>
          <CourtHeroBg />
        </div>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px", position: "relative" }}>
          <div className="label" style={{ color: "rgba(251,248,241,.5)", marginBottom: 10 }}>
            Three ways to play
          </div>
          <h2 className="display landing-text-rise" style={{ fontSize: "clamp(38px, 7vw, 80px)", margin: "0 0 36px", letterSpacing: "-.03em" }}>
            Get on
            <br />
            the <span style={{ color: "var(--accent)" }}>court</span>
            <span className="serif-display" style={{ fontStyle: "italic", fontWeight: 900, color: "var(--paper)", textTransform: "lowercase" }}>
              {" "}
              any way
            </span>
            <br />
            you want.
          </h2>
          <div className="landing-format-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { kind: "dropin" as const, label: "DROP-IN", title: "Pick-up sessions", desc: "Single-session sign-ups across the GTA → mornings, lunch hours, evenings, weekends. Beginner clinics to competitive open gym.", stat: "~32 sessions/wk" },
              { kind: "league" as const, label: "LEAGUE", title: "8–10 week seasons", desc: "Bring a team or join solo and we draft you in. Standings, playoffs, the whole thing.", stat: "14 leagues running" },
              { kind: "tournament" as const, label: "TOURNAMENT", title: "Single-day events", desc: "Pool play into bracket. Trophies, prize money, and bragging rights.", stat: "2 next month" },
            ].map((c, i) => (
              <Link
                key={c.kind}
                href="/browse"
                className="liftable landing-format-card"
                style={{
                  textAlign: "left",
                  background: i === 0 ? "var(--accent)" : "transparent",
                  color: i === 0 ? "var(--ink)" : "var(--paper)",
                  padding: 24,
                  border: `2px solid ${i === 0 ? "var(--ink)" : "var(--paper)"}`,
                  borderRadius: 8,
                  position: "relative",
                  overflow: "hidden",
                  minHeight: 280,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: `3px 3px 0 ${i === 0 ? "var(--ink)" : "var(--paper)"}`,
                  fontFamily: "var(--ui)",
                }}
              >
                <div>
                  <KindBadge kind={c.kind} invert={i !== 0} />
                  <h3 className="display landing-card-title" style={{ fontSize: "clamp(28px, 4vw, 40px)", margin: "18px 0 10px", lineHeight: 0.92, letterSpacing: "-.02em" }}>
                    {c.title}
                  </h3>
                  <p style={{ color: i === 0 ? "var(--ink-2)" : "rgba(251,248,241,.7)", fontSize: 14, lineHeight: 1.5, margin: "0 0 18px" }}>{c.desc}</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 14, borderTop: `2px solid ${i === 0 ? "var(--ink)" : "rgba(251,248,241,.2)"}` }}>
                  <span className="mono" style={{ fontSize: 11, color: i === 0 ? "var(--ink)" : "var(--accent)", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>
                    {c.stat}
                  </span>
                  <span className="mono" style={{ fontSize: 18 }} aria-hidden>
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {weekGames.length > 0 ? (
        <section className="landing-section-fade" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                This week
              </div>
              <h2 className="display landing-text-rise" style={{ fontSize: "clamp(36px, 6vw, 64px)", margin: 0, letterSpacing: "-.03em" }}>
                Spots dropping{" "}
                <span className="serif-display" style={{ fontStyle: "italic", textTransform: "lowercase" }}>
                  fast.
                </span>
              </h2>
            </div>
            <Link href="/browse" className="btn ghost">
              See all games →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="landing-week-grid">
            {weekGames.map((g, i) => (
              <div key={g.id} className="landing-week-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <WeekPreviewCard game={g} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <LandingFacilitiesSection facilities={facilities} />

      <section className="landing-section-fade" style={{ background: "var(--accent)", borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)", position: "relative", overflow: "hidden" }}>
        <div className="hero-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 36, alignItems: "center", position: "relative" }}>
          <div>
            <div className="label" style={{ marginBottom: 10 }}>
              For hosts
            </div>
            <h2 className="display landing-text-rise" style={{ fontSize: "clamp(44px, 8vw, 100px)", margin: "0 0 18px", letterSpacing: "-.04em" }}>
              You run
              <br />
              the gym.
              <br />
              <span className="serif-display" style={{ textTransform: "lowercase", fontWeight: 900 }}>We handle</span>
              <br />
              the roster.
            </h2>
            <p className="landing-text-fade" style={{ maxWidth: 520, fontSize: "clamp(15px, 2vw, 17px)", lineHeight: 1.55, color: "var(--ink)", margin: "0 0 24px" }}>
              Post your session in 60 seconds. Players sign up and Interac you directly using a unique reference code. We track who&apos;s paid, who&apos;s still owing, and who&apos;s on the wait-list.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/host/new" className="btn lg">
                Host a game →
              </Link>
              <Link href="/host" className="btn lg ghost">
                See host tools
              </Link>
            </div>
          </div>
          <div className="card landing-host-card" style={{ padding: 0, overflow: "hidden", boxShadow: "5px 5px 0 var(--ink)" }}>
            <div style={{ background: "var(--ink)", color: "var(--paper)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", fontWeight: 700 }}>
                {`HOST · ${hostPreviewGame.title.slice(0, 28)}${hostPreviewGame.title.length > 28 ? "…" : ""} · ${hostPreviewGame.signed_count}/${hostPreviewGame.capacity}`}
              </span>
              <span className="chip gold">{hostPreviewPaid} PAID</span>
            </div>
            <div style={{ padding: 14 }}>
              {hostPreviewRows.map((p, index) => (
                <div
                  key={p.id}
                  className="landing-host-row"
                  style={{
                    animationDelay: `${index * 0.06}s`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 4px",
                    borderBottom: index === hostPreviewRows.length - 1 ? "none" : "1px dashed var(--ink-3)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      border: "2px solid var(--ink)",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900,
                      fontSize: 11,
                      fontFamily: "var(--display)",
                    }}
                  >
                    {p.player_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.player_name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".08em" }}>
                      {p.payment_code}
                    </div>
                  </div>
                  {p.payment_status === "paid" ? (
                    <span className="chip" style={{ background: "var(--ok)", borderColor: "var(--ok)", color: "var(--paper)" }}>
                      Paid
                    </span>
                  ) : p.payment_status === "sent" ? (
                    <span className="chip" style={{ background: "var(--payment-sent)", borderColor: "var(--ink)", color: "var(--paper)" }}>
                      Sent
                    </span>
                  ) : (
                    <span className="chip" style={{ background: "var(--warn)", borderColor: "var(--warn)", color: "var(--paper)" }}>
                      Owes
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="support-the-platform"
        className="landing-section-fade"
        style={{ borderBottom: "2px solid var(--ink)", background: "var(--bg)", scrollMarginTop: "72px" }}
      >
        <div className="hero-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "34px 18px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>
          <div>
            <div className="display landing-text-rise" style={{ fontSize: "clamp(34px, 6vw, 64px)", lineHeight: 0.9, marginBottom: 10 }}>
              Chip in to keep
              <br />
              6IX BACK <span className="serif-display" style={{ textTransform: "lowercase" }}>on the</span> court.
            </div>
            <p className="landing-text-fade" style={{ maxWidth: 540, margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>
              Built and run solo by Edmel Ricahuerta. No ads, no fees, no investors → just Toronto volleyball.
            </p>
          </div>
          <div className="card landing-support-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ background: "var(--accent)", borderBottom: "2px solid var(--ink)", padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em" }}>
                INTERAC E-TRANSFER
              </span>
              <span className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, textAlign: "right", textTransform: "uppercase" }}>
                Any amount
              </span>
            </div>
            <div style={{ padding: 14 }}>
              <div className="label" style={{ marginBottom: 6 }}>
                Send to
              </div>
              <div className="mono" style={{ fontSize: 13, marginBottom: 10 }}>
                exricahuerta@gmail.com
              </div>
              <div className="label" style={{ marginBottom: 6 }}>
                Message
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 10 }}>
                Supporting 6IX BACK → keep it going!
              </div>
              <button type="button" className="btn sm">
                Copy support message
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        className="landing-section-fade"
        aria-labelledby="landing-final-cta-heading"
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          borderTop: "2px solid var(--ink)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none" }}>
          <CourtHeroBg />
        </div>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "52px 18px 56px",
            position: "relative",
            textAlign: "center",
          }}
        >
          <h2
            id="landing-final-cta-heading"
            className="display landing-text-rise"
            style={{
              fontSize: "clamp(36px, 7vw, 72px)",
              margin: "0 0 14px",
              lineHeight: 0.95,
              letterSpacing: "-.03em",
              color: "var(--paper)",
            }}
          >
            See you on the{" "}
            <span style={{ color: "var(--accent)" }}>court.</span>
          </h2>
          <p
            className="landing-text-fade"
            style={{
              margin: "0 auto 28px",
              maxWidth: 440,
              fontSize: "clamp(15px, 2vw, 17px)",
              lineHeight: 1.55,
              color: "rgba(251,248,241,.72)",
            }}
          >
            Browse what&apos;s live in Toronto, or post your own session → Interac straight to hosts, no booking fees.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/browse" className="btn lg accent">
              Browse schedule
            </Link>
            <Link href="/host/new" className="btn lg invert">
              Host a game
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
