import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { SixBackPageShell } from "@/components/shared/SixBackPageShell";
import { Button } from "@/components/ui/button";
import { getUpcomingGamesWithSignups } from "@/server/queries/games";

export async function HomeReferencePage() {
  const { games } = await getUpcomingGamesWithSignups();
  const show = games.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b-2 border-border bg-[var(--ink)] text-[var(--paper)]">
        <SixBackPageShell className="py-10 sm:py-14">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="pill solid">TONIGHT</span>
            <span className="pill border-[var(--paper)] bg-transparent text-[var(--paper)]">CO-ED 6S</span>
          </div>
          <h1 className="display text-[clamp(56px,12vw,144px)] leading-[0.85] tracking-[-0.04em]">
            Get on
            <br />
            the <span className="text-[var(--accent)]">court.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-[rgba(251,248,241,.75)] sm:text-base">
            38 drop-ins, 14 leagues, 2 tournaments. All Interac. All Toronto. Tap in.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="btn lg accent h-auto">
              <Link href="/app">Browse schedule</Link>
            </Button>
            <Button asChild className="btn lg invert h-auto">
              <Link href="/host">Host a game</Link>
            </Button>
          </div>
        </SixBackPageShell>
      </section>

      <div className="border-y-2 border-border bg-accent py-3">
        <div className="marquee-track display text-2xl font-black">
          <span>DROP-INS ALL WEEK</span>
          <span>INTERAC ONLY</span>
          <span>NO CARD FEES</span>
          <span>CO-ED 6S</span>
        </div>
      </div>

      <SixBackPageShell className="py-12">
        <section>
          <p className="label">01 - How it works</p>
          <h2 className="display text-[clamp(38px,7vw,80px)] leading-[0.9] tracking-[-0.03em]">
            Find a game.
            <br />
            Pay your captain.
            <br />
            <span className="scribble">Just play.</span>
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["01", "Browse the schedule", "Filter by night, neighbourhood, skill, or format."],
              ["02", "Reserve your spot", "Sign up and get a unique payment reference."],
              ["03", "Show up, hit balls", "Auto-match verifies your Interac reference quickly."],
            ].map(([n, title, body], idx) => (
              <article key={n} className="card liftable p-5" style={{ background: idx === 1 ? "var(--accent)" : "var(--paper)" }}>
                <p className="jersey text-7xl">{n}</p>
                <h3 className="display mt-2 text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-[var(--ink-2)]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 border-y-2 border-border bg-[var(--ink)] px-4 py-10 text-[var(--paper)] sm:px-6">
          <p className="label text-[rgba(251,248,241,.5)]">02 - Three ways to play</p>
          <h2 className="display text-[clamp(38px,7vw,80px)] leading-[0.9] tracking-[-0.03em]">
            Get on
            <br />
            the <span className="text-[var(--accent)]">court</span> any way
            <br />
            you want.
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["Drop-in", "Single session, individual sign-ups.", "~32 sessions/wk"],
              ["League", "Multi-week season with standings.", "14 leagues running"],
              ["Tournament", "Single-day pool play into bracket.", "2 next month"],
            ].map(([title, desc, stat], idx) => (
              <article
                key={title}
                className="card p-5"
                style={{
                  background: idx === 0 ? "var(--accent)" : "transparent",
                  color: idx === 0 ? "var(--ink)" : "var(--paper)",
                  borderColor: idx === 0 ? "var(--ink)" : "var(--paper)",
                }}
              >
                <h3 className="display text-4xl">{title}</h3>
                <p className="mt-2 text-sm">{desc}</p>
                <p className="mono mt-4 text-xs uppercase tracking-[0.12em]">{stat}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="label">03 - This week</p>
              <h2 className="display text-[clamp(36px,6vw,64px)]">Spots dropping fast.</h2>
            </div>
            <Button asChild variant="outline" className="btn ghost h-auto">
              <Link href="/app">See all</Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {show.map((game) => (
              <Link key={game.id} href={`/app/games/${game.id}`} className="card block p-4">
                <p className="chip gold">DROP-IN</p>
                <h3 className="display mt-3 text-2xl">{game.location}</h3>
                <p className="mt-2 text-sm text-[var(--ink-2)]">{game.address ?? "Venue TBA"}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="mono text-xs uppercase tracking-[0.08em]">{game.date} - {game.time}</span>
                  <span className="display text-xl">${game.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </SixBackPageShell>
    </div>
  );
}
