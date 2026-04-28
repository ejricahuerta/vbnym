import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, Clock, Video } from "lucide-react";
import { getUpcomingGamesWithSignups } from "@/server/queries/games";
import { bookedHeadsForGame } from "@/types/vbnym";
import { SiteHeader } from "@/components/layout/site-header";
import { FooterPoliciesModalTrigger } from "@/components/layout/footer-policies-modal-trigger";
import { FindMyGamesDialog } from "@/components/games/find-my-games-dialog";
import { FadeUp } from "@/components/shared/FadeUp";
import type { Game, Signup } from "@/types/vbnym";

const JPTRG_YOUTUBE_UPLOADS_PLAYLIST_ID = "UU6ycsD5o9ZyMgQrnueuDGrQ";
const JPTRG_YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@jptrg3657";

const S = {
  ink: "var(--ink)",
  ink2: "var(--ink-2)",
  ink3: "var(--ink-3)",
  accent: "var(--accent)",
  bg: "var(--bg)",
  bg2: "var(--bg-2)",
  paper: "var(--paper)",
  border: "2px solid var(--ink)",
} as const;

function formatGameDate(date: string, time: string): string {
  try {
    const d = new Date(`${date}T00:00:00`);
    const weekday = d.toLocaleDateString("en-CA", { weekday: "short" });
    const month = d.toLocaleDateString("en-CA", { month: "short" });
    const day = d.getDate();
    return `${weekday} ${month} ${day} · ${time}`;
  } catch {
    return `${date} · ${time}`;
  }
}

function CourtSVG({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 600 320"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      style={style}
    >
      <rect x="10" y="10" width="580" height="300" fill="none" stroke={S.ink} strokeOpacity={0.12} strokeWidth="1" strokeDasharray="3 5" />
      <rect x="60" y="40" width="480" height="240" fill="none" stroke={S.ink} strokeOpacity={0.3} strokeWidth="3" />
      <line x1="300" y1="40" x2="300" y2="280" stroke={S.ink} strokeOpacity={0.3} strokeWidth="3" />
      <circle cx="300" cy="40" r="3" fill={S.ink} fillOpacity={0.3} />
      <circle cx="300" cy="280" r="3" fill={S.ink} fillOpacity={0.3} />
      <g stroke={S.ink} strokeOpacity={0.15} strokeWidth="0.6">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={295} y1={48 + i * 17} x2={305} y2={48 + i * 17} />
        ))}
      </g>
      <line x1="220" y1="40" x2="220" y2="280" stroke={S.ink} strokeOpacity={0.3} strokeWidth="2" />
      <line x1="380" y1="40" x2="380" y2="280" stroke={S.ink} strokeOpacity={0.3} strokeWidth="2" />
      <line x1="60" y1="40" x2="40" y2="40" stroke={S.ink} strokeOpacity={0.21} strokeWidth="1.5" />
      <line x1="60" y1="280" x2="40" y2="280" stroke={S.ink} strokeOpacity={0.21} strokeWidth="1.5" />
      <line x1="540" y1="40" x2="560" y2="40" stroke={S.ink} strokeOpacity={0.21} strokeWidth="1.5" />
      <line x1="540" y1="280" x2="560" y2="280" stroke={S.ink} strokeOpacity={0.21} strokeWidth="1.5" />
    </svg>
  );
}

function VolleyballSVG({ size = 300 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="56" fill={S.accent} stroke={S.ink} strokeWidth="3" />
      <path d="M 12 60 Q 60 30 108 60" fill="none" stroke={S.ink} strokeWidth="2.5" />
      <path d="M 12 60 Q 60 90 108 60" fill="none" stroke={S.ink} strokeWidth="2.5" />
      <path d="M 60 4 Q 30 60 60 116" fill="none" stroke={S.ink} strokeWidth="2.5" />
      <path d="M 60 4 Q 90 60 60 116" fill="none" stroke={S.ink} strokeWidth="2.5" />
      <circle cx="60" cy="60" r="5" fill={S.ink} />
    </svg>
  );
}

function HeroCourt({ gamesCount }: { gamesCount: number }) {
  const displayCount = gamesCount > 0 ? gamesCount : 38;
  return (
    <section style={{ position: "relative", overflow: "hidden", borderBottom: S.border, background: S.bg }}>
      {/* Court SVG background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <CourtSVG style={{ position: "absolute", right: "-15%", top: "8%", width: "95%", height: "90%" }} />
      </div>
      {/* Jersey number */}
      <div
        className="hidden md:block"
        style={{
          position: "absolute",
          right: "-3%",
          top: "-4%",
          fontFamily: "var(--font-display), sans-serif",
          fontWeight: 900,
          fontSize: "min(48vw, 720px)",
          lineHeight: 0.78,
          letterSpacing: "-.06em",
          color: S.accent,
          WebkitTextStroke: `2px ${S.ink}`,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 1,
        }}
        aria-hidden
      >
        06
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 18px 56px", position: "relative", zIndex: 2 }}>
        {/* Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 10px", borderRadius: 999, border: `1.5px solid ${S.ink}`,
            fontFamily: "var(--font-mono), monospace", fontSize: 10.5, fontWeight: 600,
            letterSpacing: ".1em", textTransform: "uppercase" as const,
            background: S.accent, color: S.ink, whiteSpace: "nowrap" as const,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.ink, display: "inline-block", animation: "pulse 1.6s ease-in-out infinite" }} />
            LIVE → {displayCount} GAMES THIS WEEK
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 900,
            fontSize: "clamp(56px, 12vw, 168px)",
            letterSpacing: "-.04em",
            lineHeight: 0.86,
            textTransform: "uppercase" as const,
            margin: "0 0 20px",
            maxWidth: 1100,
            color: S.ink,
          }}
        >
          Toronto&apos;s<br />
          volleyball<br />
          <span className="sport-scribble">switchboard.</span>
        </h1>

        <p style={{ maxWidth: 560, fontSize: "clamp(15px, 2vw, 18px)", lineHeight: 1.55, color: S.ink2, margin: "0 0 28px" }}>
          Drop-ins, leagues, and tournaments across the GTA. Sign up in three taps. Pay your host by Interac. Show up and play.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          <Link
            href="/app"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 24px", background: S.ink, color: S.accent,
              border: S.border, borderRadius: 6, fontWeight: 700,
              fontFamily: "var(--font-sans), sans-serif", fontSize: 15,
              textDecoration: "none", boxShadow: `3px 3px 0 ${S.accent}`,
              transition: "transform .12s, box-shadow .12s",
            }}
          >
            Find a game tonight <ArrowRight size={18} />
          </Link>
          <FindMyGamesDialog>
            <button
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", background: "transparent", color: S.ink,
                border: S.border, borderRadius: 6, fontWeight: 700,
                fontFamily: "var(--font-sans), sans-serif", fontSize: 15,
                cursor: "pointer", boxShadow: `3px 3px 0 ${S.ink2}`,
              }}
            >
              My saved games
            </button>
          </FindMyGamesDialog>
        </div>

        {/* Stat strip */}
        <div
          style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, paddingTop: 24, borderTop: S.border }}
          className="grid-cols-2 sm:grid-cols-4"
        >
          {[
            { n: "1.8K+", l: "Players" },
            { n: `${displayCount}`, l: "This week" },
            { n: "14", l: "Leagues" },
            { n: "$0", l: "Fees" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 0.9, letterSpacing: "-.03em", color: S.ink }}>{s.n}</div>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10.5, fontWeight: 500, letterSpacing: ".18em", textTransform: "uppercase" as const, color: S.ink2, marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarqueeStrip() {
  const items = ["★ DROP-INS ALL WEEK", "★ INTERAC ONLY", "★ NO CARD FEES", "★ CO-ED 6S"];
  return (
    <div style={{ borderTop: S.border, borderBottom: S.border, background: S.accent, overflow: "hidden", padding: "12px 0" }}>
      <div className="sport-marquee-track" style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(20px, 3vw, 30px)", letterSpacing: "-.01em", color: S.ink }}>
        {[0, 1].map((k) => (
          <span key={k} style={{ display: "inline-flex", gap: 48 }}>
            {items.map((item, i) => <span key={i}>{item}</span>)}
          </span>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", h: "Browse the schedule", b: "Filter by night, neighbourhood, skill, or format. Every drop-in, league, and tournament in the area." },
    { n: "02", h: "Reserve your spot", b: "Hit Sign Up. We generate a unique payment reference and copy-ready Interac request to your host." },
    { n: "03", h: "Show up, hit balls", b: "We auto-match your reference code from the Interac message → usually within a minute. Your spot turns green. No invoices. No fees." },
  ];
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px" }}>
      <FadeUp>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap" as const, gap: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase" as const, color: S.ink2, display: "block", marginBottom: 10 }}>01 → How it works</div>
            <h2 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(38px, 7vw, 80px)", letterSpacing: "-.03em", lineHeight: 0.86, textTransform: "uppercase" as const, margin: 0, maxWidth: 780, color: S.ink }}>
              Find a game.<br />Pay your captain.<br /><span className="sport-scribble">Just play.</span>
            </h2>
          </div>
          <div style={{ maxWidth: 380, fontSize: 15, color: S.ink2, lineHeight: 1.55 }}>
            <p style={{ margin: 0 }}>
              We don&apos;t take a cut. Hosts receive payment by Interac e-Transfer → exactly how Toronto already pays. Zero card fees, ever.
            </p>
            <p style={{ margin: "12px 0 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 10px" }}>
              <span>
                If you&apos;d like to help keep the platform going, optional Interac e-Transfers are deeply appreciated.
              </span>
              <a
                href="#support-the-platform"
                aria-label="Support the platform: Interac details"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 14px",
                  background: S.accent,
                  color: S.ink,
                  border: S.border,
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  boxShadow: `2px 2px 0 ${S.ink}`,
                }}
              >
                here
              </a>
            </p>
          </div>
        </div>
      </FadeUp>
      <FadeUp delayMs={60}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="grid-cols-1 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="sport-liftable"
              style={{ padding: 24, background: i === 1 ? S.accent : S.paper, border: S.border, borderRadius: 8, boxShadow: `3px 3px 0 ${S.ink}` }}
            >
              <div style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: 88, lineHeight: 0.78, letterSpacing: "-.04em", color: S.accent, WebkitTextStroke: `2px ${S.ink}`, marginBottom: 14 }}>{s.n}</div>
              <h3 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: 24, letterSpacing: "-.02em", textTransform: "uppercase" as const, margin: "0 0 10px", color: S.ink }}>{s.h}</h3>
              <p style={{ margin: 0, color: S.ink2, fontSize: 14, lineHeight: 1.55 }}>{s.b}</p>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

function FormatGrid() {
  const formats = [
    { label: "DROP-IN", title: "Pick-up sessions", desc: "Single-session sign-ups across the GTA → mornings, lunch hours, evenings, weekends. Beginner clinics to competitive open gym.", stat: "~32 sessions/wk", yellow: true },
    { label: "LEAGUE", title: "8–10 week seasons", desc: "Bring a team or join solo and we draft you in. Standings, playoffs, the whole thing.", stat: "14 leagues running", yellow: false },
    { label: "TOURNAMENT", title: "Single-day events", desc: "Pool play into bracket. Trophies, prize money, and bragging rights.", stat: "2 next month", yellow: false },
  ];
  return (
    <section style={{ background: S.ink, color: S.paper, borderTop: S.border, borderBottom: S.border, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none" }}>
        <svg viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet" aria-hidden style={{ width: "100%", height: "100%" }}>
          <rect x="60" y="40" width="480" height="240" fill="none" stroke={S.paper} strokeWidth="3" />
          <line x1="300" y1="40" x2="300" y2="280" stroke={S.paper} strokeWidth="3" />
          <line x1="220" y1="40" x2="220" y2="280" stroke={S.paper} strokeWidth="2" />
          <line x1="380" y1="40" x2="380" y2="280" stroke={S.paper} strokeWidth="2" />
        </svg>
      </div>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px", position: "relative" }}>
        <FadeUp>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "rgba(251,248,241,.5)", marginBottom: 10 }}>02 → Three ways to play</div>
          <h2 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(38px, 7vw, 80px)", letterSpacing: "-.03em", lineHeight: 0.86, textTransform: "uppercase" as const, margin: "0 0 36px", color: S.paper }}>
            Get on<br />the <span style={{ color: S.accent }}>court</span><br /><em style={{ fontStyle: "italic", textTransform: "lowercase", color: S.paper }}>any way you want.</em>
          </h2>
        </FadeUp>
        <FadeUp delayMs={60}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="grid-cols-1 sm:grid-cols-3">
            {formats.map((c, i) => (
              <Link
                key={i}
                href="/app"
                className="sport-liftable"
                style={{
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  textAlign: "left", background: c.yellow ? S.accent : "transparent",
                  color: c.yellow ? S.ink : S.paper, padding: 24,
                  border: `2px solid ${c.yellow ? S.ink : S.paper}`, borderRadius: 8,
                  position: "relative", overflow: "hidden", minHeight: 280,
                  boxShadow: `3px 3px 0 ${c.yellow ? S.ink : S.paper}`,
                  textDecoration: "none",
                }}
              >
                <div>
                  <span style={{
                    fontFamily: "var(--font-mono), monospace", fontSize: 10, fontWeight: 700,
                    letterSpacing: ".14em", textTransform: "uppercase" as const,
                    padding: "4px 8px", border: `1.5px solid ${c.yellow ? S.ink : S.paper}`,
                    borderRadius: 4, display: "inline-block",
                    color: c.yellow ? S.ink : S.paper,
                  }}>{c.label}</span>
                  <h3 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-.02em", lineHeight: 0.92, textTransform: "uppercase" as const, margin: "18px 0 10px", color: c.yellow ? S.ink : S.paper }}>{c.title}</h3>
                  <p style={{ color: c.yellow ? S.ink2 : "rgba(251,248,241,.7)", fontSize: 14, lineHeight: 1.5, margin: "0 0 18px" }}>{c.desc}</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 14, borderTop: `2px solid ${c.yellow ? S.ink : "rgba(251,248,241,.2)"}` }}>
                  <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: c.yellow ? S.ink : S.accent, textTransform: "uppercase" as const, letterSpacing: ".12em", fontWeight: 700 }}>{c.stat}</span>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </div>
              </Link>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function GameCard({ game, signups }: { game: Game; signups: Signup[] }) {
  const booked = bookedHeadsForGame(signups);
  const spotsLeft = game.cap - booked;
  const isFull = spotsLeft <= 0;
  const dateStr = formatGameDate(game.date, game.time);

  return (
    <Link
      href={`/games/${game.id}`}
      className="sport-liftable"
      style={{
        display: "block", background: S.paper, border: S.border, borderRadius: 8,
        boxShadow: `3px 3px 0 ${S.ink}`, textDecoration: "none", color: S.ink, overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div style={{ background: S.ink, color: S.accent, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, letterSpacing: ".14em", fontWeight: 700, textTransform: "uppercase" as const }}>DROP-IN</span>
        <span style={{
          fontFamily: "var(--font-mono), monospace", fontSize: 10, fontWeight: 700,
          letterSpacing: ".1em", textTransform: "uppercase" as const,
          padding: "3px 8px", borderRadius: 4,
          background: isFull ? "rgba(255,77,46,.8)" : S.accent, color: S.ink,
        }}>
          {isFull ? "FULL" : `${spotsLeft} LEFT`}
        </span>
      </div>
      {/* Card body */}
      <div style={{ padding: "16px 16px 20px" }}>
        <h3 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: "-.02em", textTransform: "uppercase" as const, margin: "0 0 10px", lineHeight: 1, color: S.ink }}>{game.location}</h3>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 5, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: S.ink2 }}>
            <Clock size={12} />
            <span>{dateStr}</span>
          </div>
          {game.address && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: S.ink2 }}>
              <MapPin size={12} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{game.address}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `2px solid ${S.ink}` }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: ".14em", color: S.ink3, fontWeight: 700, textTransform: "uppercase" as const }}>SPOTS LEFT</div>
            <div style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: 24, color: S.ink }}>{spotsLeft}<span style={{ color: S.ink3, fontSize: 14 }}>/{game.cap}</span></div>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: ".14em", color: S.ink3, fontWeight: 700, textTransform: "uppercase" as const }}>INTERAC</div>
            <div style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: 24, color: S.ink }}>${game.price}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ThisWeek({ games, signupsByGameId, totalGames }: { games: Game[]; signupsByGameId: Record<string, Signup[]>; totalGames: number }) {
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px" }}>
      <FadeUp>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" as const, gap: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase" as const, color: S.ink2, marginBottom: 10 }}>03 → This week</div>
            <h2 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(36px, 6vw, 64px)", letterSpacing: "-.03em", lineHeight: 0.86, textTransform: "uppercase" as const, margin: 0, color: S.ink }}>
              Spots dropping <em style={{ fontStyle: "italic", textTransform: "lowercase" }}>fast.</em>
            </h2>
          </div>
          <Link
            href="/app"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 18px", background: "transparent", color: S.ink,
              border: S.border, borderRadius: 6, fontWeight: 700,
              fontFamily: "var(--font-sans), sans-serif", fontSize: 14,
              textDecoration: "none", boxShadow: `3px 3px 0 ${S.ink}`,
              whiteSpace: "nowrap" as const,
            }}
          >
            See all {totalGames} <ArrowRight size={16} />
          </Link>
        </div>
      </FadeUp>
      <FadeUp delayMs={60}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="grid-cols-1 sm:grid-cols-3">
          {games.map((g) => (
            <GameCard key={g.id} game={g} signups={signupsByGameId[g.id] ?? []} />
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

function HostCTA() {
  return (
    <section style={{ background: S.accent, borderTop: S.border, borderBottom: S.border, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -40, opacity: 0.55 }} className="hidden md:block" aria-hidden>
        <VolleyballSVG size={340} />
      </div>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 36, alignItems: "center", position: "relative" }} className="grid-cols-1 sm:grid-cols-2">
        <FadeUp>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase" as const, color: S.ink2, marginBottom: 10 }}>For hosts</div>
          <h2 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(44px, 8vw, 100px)", letterSpacing: "-.04em", lineHeight: 0.86, textTransform: "uppercase" as const, margin: "0 0 18px", color: S.ink }}>
            You run<br />the gym.<br />We handle<br />the roster.
          </h2>
          <p style={{ maxWidth: 520, fontSize: "clamp(15px, 2vw, 17px)", lineHeight: 1.55, color: S.ink, margin: "0 0 24px" }}>
            Post your session in 60 seconds. Players sign up and Interac you directly using a unique reference code. We track who&apos;s paid, who&apos;s still owing, and who&apos;s on the wait-list.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            <Link
              href="/app"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", background: S.ink, color: S.accent,
                border: S.border, borderRadius: 6, fontWeight: 700,
                fontFamily: "var(--font-sans), sans-serif", fontSize: 15,
                textDecoration: "none", boxShadow: `3px 3px 0 ${S.ink2}`,
              }}
            >
              Browse games <ArrowRight size={18} />
            </Link>
            <Link
              href="/host"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", background: "transparent", color: S.ink,
                border: S.border, borderRadius: 6, fontWeight: 700,
                fontFamily: "var(--font-sans), sans-serif", fontSize: 15,
                textDecoration: "none", boxShadow: `3px 3px 0 ${S.ink}`,
              }}
            >
              Host a run
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function StatsSection({ gamesCount }: { gamesCount: number }) {
  const displayCount = gamesCount > 0 ? gamesCount : 38;
  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px" }}>
      <FadeUp>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="grid-cols-2 sm:grid-cols-4">
          {[
            { n: "1,840+", l: "Active players" },
            { n: `${displayCount}`, l: "Games this week" },
            { n: "14", l: "Leagues running" },
            { n: "$0", l: "Booking fees" },
          ].map((s, i) => (
            <div key={i} style={{ borderTop: `4px solid ${S.ink}`, paddingTop: 14 }}>
              <div style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(34px, 5vw, 64px)", lineHeight: 0.9, letterSpacing: "-.03em", color: S.ink }}>{s.n}</div>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, fontWeight: 500, letterSpacing: ".14em", textTransform: "uppercase" as const, color: S.ink2, marginTop: 8 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

function YouTubeSection() {
  return (
    <section style={{ borderTop: `1px solid ${S.bg2}`, borderBottom: `1px solid ${S.bg2}`, background: S.bg2, padding: "64px 18px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <FadeUp>
          <div style={{ maxWidth: 520, marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontFamily: "var(--font-mono), monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" as const, color: S.ink2 }}>
              <Video size={16} color="#dc2626" aria-hidden /> YouTube
            </div>
            <h2 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: "clamp(28px, 5vw, 48px)", letterSpacing: "-.03em", lineHeight: 0.9, textTransform: "uppercase" as const, margin: "0 0 12px", color: S.ink }}>
              Highlights and updates
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: S.ink2, margin: 0 }}>
              Catch game footage, announcements, and community moments on our channel.
            </p>
          </div>
        </FadeUp>
        <FadeUp delayMs={90}>
          <div style={{ position: "relative", aspectRatio: "16/9", width: "100%", overflow: "hidden", borderRadius: 8, border: S.border, background: "#000", boxShadow: `5px 5px 0 ${S.ink}` }}>
            <iframe
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              src={`https://www.youtube.com/embed/videoseries?list=${JPTRG_YOUTUBE_UPLOADS_PLAYLIST_ID}`}
              title="JPtr G → latest videos on YouTube"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
            />
          </div>
        </FadeUp>
        <FadeUp delayMs={160}>
          <a
            href={JPTRG_YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24,
              padding: "12px 20px", background: "transparent", color: S.ink,
              border: S.border, borderRadius: 6, fontWeight: 700,
              fontFamily: "var(--font-sans), sans-serif", fontSize: 14,
              textDecoration: "none", boxShadow: `3px 3px 0 ${S.ink}`,
            }}
          >
            <ExternalLink size={16} aria-hidden /> Open channel on YouTube
          </a>
        </FadeUp>
      </div>
    </section>
  );
}

function SupportSection() {
  return (
    <section id="support-the-platform" style={{ scrollMarginTop: 72, borderTop: S.border, borderBottom: S.border, background: S.paper }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 18px" }}>
        <FadeUp>
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: ".14em",
              textTransform: "uppercase" as const,
              color: S.ink2,
              marginBottom: 10,
            }}
          >
            Support the platform
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(24px, 4vw, 36px)",
              letterSpacing: "-.03em",
              margin: "0 0 12px",
              color: S.ink,
              textTransform: "uppercase" as const,
            }}
          >
            Optional Interac e-Transfer
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: S.ink2, maxWidth: 520 }}>
            Send to{" "}
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 14, color: S.ink }}>
              exricahuerta@gmail.com
            </span>
            . Message: <em>Supporting 6IX BACK</em>. Any amount helps keep scheduling and matching free for hosts and players.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer style={{ background: "#111114", color: "rgba(251,248,241,.9)", borderTop: S.border }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="grid-cols-1 sm:grid-cols-2">
        <div>
          <p style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 900, fontSize: 20, textTransform: "uppercase" as const, letterSpacing: "-.01em", marginBottom: 16, color: "rgba(251,248,241,.9)" }}>6IX BACK Volleyball</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(251,248,241,.5)", marginBottom: 24, maxWidth: 320 }}>
            Defining a new standard of metropolitan volleyball where athletic excellence meets community.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="https://www.instagram.com/vb.ny.mrkhm" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "rgba(251,248,241,.5)", textDecoration: "none" }}>Instagram</a>
            <a href={JPTRG_YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "rgba(251,248,241,.5)", textDecoration: "none" }}>YouTube</a>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, fontWeight: 700, letterSpacing: ".3em", textTransform: "uppercase" as const, color: "rgba(251,248,241,.3)", margin: 0 }}>Community</p>
            {[{ href: "/app", label: "Games" }, { href: "#how-it-works", label: "How it works" }, { href: "/community", label: "Community hub" }, { href: "/app/my-games", label: "My saved games" }].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: 14, color: "rgba(251,248,241,.55)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, fontWeight: 700, letterSpacing: ".3em", textTransform: "uppercase" as const, color: "rgba(251,248,241,.3)", margin: 0 }}>Legal</p>
            {[{ href: "/terms", label: "Terms of Service" }, { href: "/privacy", label: "Privacy Policy" }, { href: "/admin", label: "Organizer login" }].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: 14, color: "rgba(251,248,241,.55)", textDecoration: "none" }}>{l.label}</Link>
            ))}
            <FooterPoliciesModalTrigger />
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(251,248,241,.08)", padding: "20px 18px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
          <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "rgba(251,248,241,.3)", margin: 0 }}>
            © 2026 6IX BACK Volleyball. Made by{" "}
            <a href="https://ednsy.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "rgba(251,248,241,.4)" }}>Ed and Sy</a>.
          </p>
          <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" as const, color: "rgba(251,248,241,.3)", margin: 0 }}>EST. 2026</p>
        </div>
      </div>
    </footer>
  );
}

export async function HomeMarketingPage() {
  const { games, signupsByGameId } = await getUpcomingGamesWithSignups();

  const thisWeek = games.slice(0, 3);

  return (
    <div style={{ background: S.bg, color: S.ink, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      <SiteHeader />

      <main>
        <HeroCourt gamesCount={games.length} />
        <MarqueeStrip />
        <HowItWorks />
        <FormatGrid />
        {thisWeek.length > 0 && (
          <ThisWeek games={thisWeek} signupsByGameId={signupsByGameId} totalGames={games.length} />
        )}
        <HostCTA />
        <StatsSection gamesCount={games.length} />
        <YouTubeSection />
        <SupportSection />
      </main>

      <LandingFooter />
    </div>
  );
}
