import { redirect } from "next/navigation";

import { getPlayerSignupsWithUpcomingGamesByEmail } from "@/server/queries/player-signups-by-email";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPlayerSessionEmail } from "@/lib/auth";
function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function formatStart(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

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
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "2px solid var(--ink)",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: "var(--ink)", color: "var(--paper)", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Game</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>When</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Venue</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Price</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>You</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Code</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Payment</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ signup, game }) => (
                  <tr key={signup.id} style={{ borderTop: "2px solid var(--ink)" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{game.title}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{formatStart(game.starts_at)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {game.venue_name}
                      {game.venue_area ? ` · ${game.venue_area}` : ""}
                    </td>
                    <td style={{ padding: "12px 14px" }}>{formatMoney(game.price_cents)}</td>
                    <td style={{ padding: "12px 14px" }}>{signup.player_name}</td>
                    <td className="mono" style={{ padding: "12px 14px", fontSize: 12 }}>
                      {signup.payment_code}
                    </td>
                    <td style={{ padding: "12px 14px", textTransform: "capitalize" }}>{signup.payment_status}</td>
                    <td style={{ padding: "12px 14px", textTransform: "capitalize" }}>{signup.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
