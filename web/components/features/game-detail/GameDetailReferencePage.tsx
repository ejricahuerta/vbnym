import { notFound } from "next/navigation";
import Link from "next/link";

import { ReferenceSignupForm } from "@/components/features/game-detail/ReferenceSignupForm";
import { SixBackPageShell } from "@/components/shared/SixBackPageShell";
import { Badge } from "@/components/ui/badge";
import { bookedHeadsForGame } from "@/types/vbnym";
import { getGameWithSignups } from "@/server/queries/games";

export async function GameDetailReferencePage({ id }: { id: string }) {
  const data = await getGameWithSignups(id);
  if (!data) notFound();

  const booked = bookedHeadsForGame(data.signups);
  const spotsLeft = Math.max((data.game.cap ?? 0) - booked, 0);
  const full = spotsLeft <= 0;

  return (
    <div>
      <section className="border-b-2 border-border bg-background">
        <SixBackPageShell className="py-5">
          <Link href="/app" className="mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Back to schedule
          </Link>
        </SixBackPageShell>
      </section>

      <section className="border-b-2 border-border bg-[var(--ink)] text-[var(--paper)]">
        <SixBackPageShell className="py-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="chip gold">DROP-IN</span>
                <span className="chip outline border-[var(--paper)] text-[var(--paper)]">CO-ED 6S</span>
              </div>
              <h1 className="display text-[clamp(36px,7vw,80px)] leading-[0.92]">{data.game.location}</h1>
              <p className="mt-3 text-sm text-[rgba(251,248,241,.8)]">
                {data.game.date} · {data.game.time}
              </p>
              <p className="mt-1 text-sm text-[rgba(251,248,241,.8)]">{data.game.address ?? "Venue TBA"}</p>
            </div>
            <div className="card p-0">
              <div className="flex items-center justify-between bg-[var(--ink)] px-5 py-4 text-[var(--paper)]">
                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.14em] text-[rgba(251,248,241,.6)]">Per player</p>
                  <p className="display text-4xl text-[var(--accent)]">${data.game.price}</p>
                </div>
                <div className="text-right">
                  <p className="mono text-[10px] uppercase tracking-[0.14em] text-[rgba(251,248,241,.6)]">Spots left</p>
                  <p className="display text-4xl">{spotsLeft}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge variant={full ? "destructive" : "outline"}>{full ? "Join Waitlist" : "Sign Up"}</Badge>
                  <Badge variant="outline">{booked}/{data.game.cap} signed</Badge>
                </div>
                <ReferenceSignupForm gameId={data.game.id} full={full} />
              </div>
            </div>
          </div>
        </SixBackPageShell>
      </section>

      <SixBackPageShell className="py-8">
        <div className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
          <div>
            <p className="label">Format</p>
            <p className="mb-6 text-sm text-muted-foreground">
              {data.game.entry_instructions ??
                "Show up 10 minutes early. Captains pick balanced teams and rotate courts."}
            </p>
            <p className="label">Your host</p>
            <div className="card flex items-center gap-3 p-4">
              <div className="grid size-11 place-items-center rounded-full border-2 border-border bg-accent font-black">
                H
              </div>
              <div>
                <p className="font-semibold">Host payout contact</p>
                <p className="mono text-xs uppercase tracking-[0.08em] text-muted-foreground">{data.game.etransfer}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="label">Roster - {data.signups.length}</p>
            <div className="card p-0">
              <ul>
                {data.signups.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-muted-foreground">No players yet.</li>
                ) : (
                  data.signups.map((signup, idx) => (
                    <li key={signup.id} className={`px-4 py-3 text-sm ${idx < data.signups.length - 1 ? "border-b border-dashed border-border" : ""}`}>
                      {signup.name}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </SixBackPageShell>
    </div>
  );
}
