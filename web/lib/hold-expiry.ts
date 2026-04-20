import type { Game, Signup } from "@/types/vbnym";
import type { AdminSupabaseClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/notifications";
import {
  formatGameCourtLine,
  formatGameDateLong,
  formatGameTimeRangeLabel,
} from "@/lib/game-display";
import { escapeEmailHtml } from "@/lib/email-payment-copy-blocks";
import {
  playerEmailLegalFooterHtml,
  playerEmailLegalFooterText,
  playerPoliciesAbsoluteUrl,
} from "@/lib/player-email-legal";
import { normalizeGame } from "@/lib/normalize-game";

function holdExpiredEmailHtml(opts: {
  name: string;
  game: Game;
  gameUrl: string;
  policiesUrl: string;
}): string {
  const loc = escapeEmailHtml(opts.game.location);
  const courtLine = formatGameCourtLine(opts.game.court);
  const courtBlock = courtLine
    ? `<p style="margin:-4px 0 12px;color:#475569;font-size:13px">${escapeEmailHtml(courtLine)}</p>`
    : "";
  const when = escapeEmailHtml(
    `${formatGameDateLong(opts.game.date)} · ${formatGameTimeRangeLabel(opts.game)}`
  );
  const payer = escapeEmailHtml(opts.name);
  const link = escapeEmailHtml(opts.gameUrl);

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#131b2e">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
        <div style="padding:18px 22px;background:#dc2626;color:#ffffff">
          <div style="font-size:18px;font-weight:700;">North York | Markham Volleyball</div>
          <div style="margin-top:3px;font-size:12px;opacity:0.85;letter-spacing:1px;text-transform:uppercase">Registration expired</div>
        </div>
        <div style="padding:24px 22px">
          <h2 style="margin:0 0 10px;font-size:22px;color:#131b2e">Your hold has expired</h2>
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            Hi ${payer}, your payment was not received in time for <strong>${loc}</strong> and your spot has been released.
          </p>
          ${courtBlock}
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            <span style="color:#64748b;font-size:13px">${when}</span>
          </p>
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            If spots are still available, you can sign up again from the game page.
          </p>
          <p style="margin:0 0 18px">
            <a href="${link}" style="display:inline-block;background:#0f274f;color:#ffffff;padding:11px 16px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">
              View game details
            </a>
          </p>
          ${playerEmailLegalFooterHtml({
            policiesUrl: opts.policiesUrl,
            waiverAccepted: true,
          })}
        </div>
      </div>
    </div>
  `;
}

function holdExpiredEmailText(opts: {
  name: string;
  game: Game;
  gameUrl: string;
  policiesUrl: string;
}): string {
  const courtLine = formatGameCourtLine(opts.game.court);
  const when = `${formatGameDateLong(opts.game.date)} · ${formatGameTimeRangeLabel(opts.game)}`;
  return [
    `Hi ${opts.name},`,
    ``,
    `Your payment was not received in time for ${opts.game.location} and your spot has been released.`,
    when,
    ...(courtLine ? [courtLine] : []),
    ``,
    `If spots are still available, you can sign up again from the game page.`,
    ``,
    `View game details: ${opts.gameUrl}`,
    playerEmailLegalFooterText({
      policiesUrl: opts.policiesUrl,
      waiverAccepted: true,
    }),
  ].join("\n");
}

/**
 * Find expired unpaid signups, notify the players, then delete them.
 * Called from the payment sync cron to keep the roster clean and players informed.
 */
export async function notifyAndCleanExpiredHolds(
  admin: AdminSupabaseClient
): Promise<number> {
  const nowIso = new Date().toISOString();

  const { data: expired, error } = await admin
    .from("signups")
    .select("*")
    .eq("paid", false)
    .not("payment_code_expires_at", "is", null)
    .lt("payment_code_expires_at", nowIso);

  if (error || !expired || expired.length === 0) return 0;

  const gameIds = [...new Set((expired as Signup[]).map((s) => s.game_id))];
  const { data: gameRows } = await admin
    .from("games")
    .select("*")
    .in("id", gameIds);

  const gamesById = new Map<string, Game>();
  for (const row of (gameRows ?? []) as Game[]) {
    gamesById.set(row.id, normalizeGame(row));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const policiesUrl = playerPoliciesAbsoluteUrl();
  let notified = 0;

  for (const row of expired as Signup[]) {
    const game = gamesById.get(row.game_id);
    if (!game) continue;

    const gameUrl = new URL(`/app/games/${game.id}`, appUrl).toString();
    try {
      await sendTransactionalEmail({
        to: row.email,
        subject: `NYM Volleyball — your hold expired for ${game.location}`,
        html: holdExpiredEmailHtml({
          name: row.name,
          game,
          gameUrl,
          policiesUrl,
        }),
        text: holdExpiredEmailText({
          name: row.name,
          game,
          gameUrl,
          policiesUrl,
        }),
      });
      notified += 1;
    } catch (e) {
      console.error(`Failed to send hold-expiry email for signup ${row.id}:`, e);
    }
  }

  await admin
    .from("signups")
    .delete()
    .eq("paid", false)
    .not("payment_code_expires_at", "is", null)
    .lt("payment_code_expires_at", nowIso);

  return notified;
}
