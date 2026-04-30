import { redirect } from "next/navigation";

import { getPlayerSignupsWithUpcomingGamesByEmail } from "@/server/queries/player-signups-by-email";
import { PlayerPortalTable } from "@/components/features/player/PlayerPortalTable";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPlayerSessionEmail } from "@/lib/auth";

export async function PlayerPortalPage() {
  const sessionEmail = await getPlayerSessionEmail();
  if (!sessionEmail) {
    redirect("/login");
  }

  const { rows, queryError } = await getPlayerSignupsWithUpcomingGamesByEmail(sessionEmail);

  return (
    <div>
      <SiteHeader />
      <section style={{ borderBottom: "2px solid var(--ink)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 18px" }}>
          <div className="label" style={{ marginBottom: 10 }}>
            Players
          </div>
          <h1 className="display" style={{ fontSize: "clamp(40px, 7vw, 72px)", margin: "0 0 12px", letterSpacing: "-.03em" }}>
            My{" "}
            <span className="serif-display" style={{ fontStyle: "italic", textTransform: "lowercase" }}>
              games.
            </span>
          </h1>
          <p style={{ maxWidth: 560, color: "var(--ink-2)", fontSize: 16, margin: 0 }}>
            Upcoming sessions where you&apos;re registered, your payment code, and status.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 18px" }}>
        {queryError ? (
          <p role="alert" style={{ fontSize: 15 }}>
            Could not load your games: {queryError}
          </p>
        ) : rows.length === 0 ? (
          <div className="card" style={{ padding: "22px 24px", border: "2px solid var(--ink)" }}>
            <p style={{ margin: 0, fontSize: 15 }}>
              No upcoming games found for <strong>{sessionEmail}</strong>. Browse{" "}
              <a href="/browse" style={{ fontWeight: 700, color: "var(--ink)" }}>
                live games
              </a>{" "}
              and sign up first.
            </p>
          </div>
        ) : (
          <PlayerPortalTable rows={rows} />
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
