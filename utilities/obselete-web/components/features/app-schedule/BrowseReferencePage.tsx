import Link from "next/link";

import { SixBackPageShell } from "@/components/shared/SixBackPageShell";
import { Badge } from "@/components/ui/badge";
import { bookedHeadsForGame } from "@/types/vbnym";
import { getUpcomingGamesWithSignups } from "@/server/queries/games";

export async function BrowseReferencePage() {
  const { games, signupsByGameId, fetchError } = await getUpcomingGamesWithSignups();

  return (
    <div>
      <section className="border-b-2 border-border bg-background">
        <SixBackPageShell className="py-8">
          <p className="label">Browse - {games.length} results</p>
          <h1 className="display text-[clamp(44px,9vw,96px)] leading-[0.9] tracking-[-0.04em]">
            What&apos;s on
            <br />
            <span className="serif-display lowercase">this week.</span>
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip">All</span>
            <span className="chip outline">Drop-ins</span>
            <span className="chip outline">Leagues</span>
            <span className="chip outline">Tournaments</span>
          </div>
        </SixBackPageShell>
      </section>

      <SixBackPageShell className="py-8">
        {fetchError ? <p className="text-sm text-destructive">{fetchError}</p> : null}
        {games.length === 0 ? <p className="text-sm text-muted-foreground">No games posted yet.</p> : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => {
            const signups = signupsByGameId[game.id] ?? [];
            const booked = bookedHeadsForGame(signups);
            const spots = Math.max((game.cap ?? 0) - booked, 0);
            return (
              <Link key={game.id} href={`/app/games/${game.id}`} className="card liftable block overflow-hidden p-0">
                <div className="flex items-center justify-between border-b-2 border-border bg-accent px-4 py-2">
                  <span className="chip gold">DROP-IN</span>
                  <Badge variant={spots > 0 ? "outline" : "destructive"}>{spots > 0 ? `${spots} left` : "Wait-list"}</Badge>
                </div>
                <div className="p-4">
                  <h3 className="display text-2xl leading-[0.95]">{game.location}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{game.address ?? "Venue TBA"}</p>
                  <p className="mono mt-2 text-xs uppercase tracking-[0.08em] text-muted-foreground">{game.date} - {game.time}</p>
                </div>
                <div className="flex items-center justify-between border-t-2 border-dashed border-border bg-[var(--bg)] px-4 py-3">
                  <span className="mono text-xs font-bold uppercase tracking-[0.08em]">{booked}/{game.cap} signed</span>
                  <span className="display text-xl">${game.price}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </SixBackPageShell>
    </div>
  );
}
