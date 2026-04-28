import { google } from "googleapis";
import type { Game, Signup } from "@/types/vbnym";
import type { AdminSupabaseClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/notifications";
import {
  markGameGmailReauthRequiredAndNotify,
  markUniversalGmailReauthRequiredAndNotify,
} from "@/lib/gmail-reauth-reminder";
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

const CODE_PATTERN = /\b(?:NYM|6IX)-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g;
const INTERAC_SENDER = "notify@payments.interac.ca";

type AdminSettingsRow = {
  gmail_refresh_token: string | null;
  gmail_connected_email: string | null;
  gmail_assumed_expires_at: string | null;
  gmail_reauth_required: boolean | null;
};

type GmailConnectionRow = {
  id: string;
  gmail_refresh_token: string | null;
  gmail_connected_email: string | null;
  gmail_assumed_expires_at: string | null;
  gmail_provider_refresh_expires_at: string | null;
  reauth_required: boolean | null;
  last_successful_refresh_at: string | null;
  gmail_connected_at: string | null;
};

type GameEmailSyncConfigRow = {
  game_id: string;
  preferred_gmail_connection_id: string | null;
  use_universal_fallback: boolean | null;
};

type FetchGroup = {
  refreshToken: string;
  connectionIds: string[];
  isUniversal: boolean;
  sampleGameId?: string;
};

type GmailCodeHit = {
  code: string;
  messageId: string;
  senderEmail: string;
};

/** Exported for unit tests (same logic as Gmail metadata parsing). */
export function parseSenderEmail(raw: string | null | undefined): string {
  if (!raw) return "";
  const match = raw.match(/<([^>]+)>/);
  const email = (match?.[1] ?? raw).trim().toLowerCase();
  return email.replace(/^"|"$/g, "");
}

/** Exported for unit tests (same logic as Gmail subject/snippet parsing). */
export function extractCodes(raw: string): string[] {
  const matches = raw.toUpperCase().match(CODE_PATTERN);
  return [...new Set(matches ?? [])];
}

function buildOAuthClient(redirectUri: string) {
  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Gmail OAuth client credentials. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET, or GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Redirect URI sent to Google (must match Authorized redirect URIs exactly).
 * Set `GOOGLE_REDIRECT_URI` when the request `origin` is wrong (e.g. proxy) or you want a fixed URL.
 * Otherwise defaults to this app’s callback on the current origin.
 */
export function getGmailRedirectUri(origin: string): string {
  const fromEnv = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  return `${origin}/api/admin/gmail/oauth/callback`;
}

export function createGmailOAuthUrl(origin: string, state?: string): string {
  const oauth = buildOAuthClient(getGmailRedirectUri(origin));
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    ...(state ? { state } : {}),
  });
}

export type GmailOAuthStateV1 = {
  v: 1;
  mode: "universal" | "game";
  gameId?: string;
};

export function encodeGmailOAuthState(payload: GmailOAuthStateV1): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeGmailOAuthState(raw: string | null): GmailOAuthStateV1 | null {
  if (!raw?.trim()) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as GmailOAuthStateV1;
    if (parsed?.v !== 1 || (parsed.mode !== "universal" && parsed.mode !== "game")) {
      return null;
    }
    if (parsed.mode === "game" && !parsed.gameId?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function exchangeGmailCode(
  origin: string,
  code: string
): Promise<{
  refreshToken: string | null;
  connectedEmail: string | null;
  providerRefreshExpiresAt: string | null;
}> {
  const oauth = buildOAuthClient(getGmailRedirectUri(origin));
  const { tokens } = await oauth.getToken(code);
  oauth.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth, version: "v2" });
  const { data } = await oauth2.userinfo.get();

  let providerRefreshExpiresAt: string | null = null;
  const rtExp = (tokens as { refresh_token_expires_in?: number }).refresh_token_expires_in;
  if (typeof rtExp === "number" && Number.isFinite(rtExp) && rtExp > 0) {
    providerRefreshExpiresAt = new Date(Date.now() + rtExp * 1000).toISOString();
  }

  return {
    refreshToken: tokens.refresh_token ?? null,
    connectedEmail: data.email?.toLowerCase() ?? null,
    providerRefreshExpiresAt,
  };
}

function isInvalidGrantError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.toLowerCase().includes("invalid_grant")) return true;
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { error?: string } } }).response?.data;
    if (data?.error === "invalid_grant") return true;
  }
  return false;
}

/** Exported for unit tests and diagnostics. */
export function isGameConnectionUsable(row: GmailConnectionRow): boolean {
  const token = row.gmail_refresh_token?.trim();
  if (!token) return false;
  if (row.reauth_required) return false;
  const now = Date.now();
  if (row.gmail_assumed_expires_at) {
    const t = new Date(row.gmail_assumed_expires_at).getTime();
    if (Number.isFinite(t) && now >= t) return false;
  }
  if (row.gmail_provider_refresh_expires_at) {
    const t = new Date(row.gmail_provider_refresh_expires_at).getTime();
    if (Number.isFinite(t) && now >= t) return false;
  }
  return true;
}

/** Exported for unit tests and diagnostics. */
export function isUniversalInboxUsable(row: AdminSettingsRow): boolean {
  const token = row.gmail_refresh_token?.trim();
  if (!token) return false;
  if (row.gmail_reauth_required) return false;
  const now = Date.now();
  if (row.gmail_assumed_expires_at) {
    const t = new Date(row.gmail_assumed_expires_at).getTime();
    if (Number.isFinite(t) && now >= t) return false;
  }
  return true;
}

/** Exported for unit tests and diagnostics. */
export function resolveEffectiveInbox(
  gameId: string,
  config: GameEmailSyncConfigRow | undefined,
  connById: Map<string, GmailConnectionRow>,
  universal: AdminSettingsRow | null
): { refreshToken: string; kind: "game" | "universal"; connectionId?: string } | null {
  const preferredId = config?.preferred_gmail_connection_id?.trim();
  if (preferredId) {
    const conn = connById.get(preferredId);
    if (conn && isGameConnectionUsable(conn)) {
      return {
        refreshToken: conn.gmail_refresh_token!,
        kind: "game",
        connectionId: conn.id,
      };
    }
  }
  const useUniversalFallback = config?.use_universal_fallback !== false;
  if (useUniversalFallback && universal && isUniversalInboxUsable(universal)) {
    return { refreshToken: universal.gmail_refresh_token!, kind: "universal" };
  }
  return null;
}

function upsertFetchGroup(
  groups: Map<string, FetchGroup>,
  refreshToken: string,
  kind: "game" | "universal",
  connectionId: string | undefined,
  gameId: string
): void {
  let g = groups.get(refreshToken);
  if (!g) {
    g = {
      refreshToken,
      connectionIds: [],
      isUniversal: false,
    };
    groups.set(refreshToken, g);
  }
  if (kind === "universal") g.isUniversal = true;
  if (connectionId && !g.connectionIds.includes(connectionId)) {
    g.connectionIds.push(connectionId);
  }
  if (!g.sampleGameId) g.sampleGameId = gameId;
}

async function findCodeHits(refreshToken: string, origin: string): Promise<GmailCodeHit[]> {
  const oauth = buildOAuthClient(getGmailRedirectUri(origin));
  oauth.setCredentials({ refresh_token: refreshToken });
  await oauth.getAccessToken();
  const gmail = google.gmail({ version: "v1", auth: oauth });

  const { data: listData } = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100,
    q: 'newer_than:30d ("NYM-" OR "6IX-")',
  });

  const messages = listData.messages ?? [];
  const hits: GmailCodeHit[] = [];

  for (const message of messages) {
    if (!message.id) continue;
    const { data } = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject"],
    });
    const headers = data.payload?.headers ?? [];
    const fromHeader = headers.find((h) => h.name?.toLowerCase() === "from")?.value;
    const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
    const snippet = data.snippet ?? "";
    const haystack = `${subject}\n${snippet}`;
    const codes = extractCodes(haystack);
    const senderEmail = parseSenderEmail(fromHeader);
    for (const code of codes) {
      hits.push({
        code,
        messageId: message.id,
        senderEmail,
      });
    }
  }

  return hits;
}

function paymentConfirmedEmailHtml(opts: {
  name: string;
  game: Game;
  headCount: number;
  totalPaid: number;
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
        <div style="padding:18px 22px;background:#16a34a;color:#ffffff">
          <div style="font-size:18px;font-weight:700;">6IX BACK Volleyball</div>
          <div style="margin-top:3px;font-size:12px;opacity:0.85;letter-spacing:1px;text-transform:uppercase">Payment confirmed</div>
        </div>
        <div style="padding:24px 22px">
          <h2 style="margin:0 0 10px;font-size:22px;color:#131b2e">You're confirmed!</h2>
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            Hi ${payer}, your payment has been received and verified. You're on the roster for <strong>${loc}</strong>.
          </p>
          ${courtBlock}
          <p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">
            <span style="color:#64748b;font-size:13px">${when}</span>
          </p>
          <p style="margin:0 0 8px;color:#334155;font-size:14px">
            Group size: <strong>${opts.headCount}</strong><br />
            Amount paid: <strong>$${opts.totalPaid.toFixed(2)}</strong>
          </p>
          <p style="margin:0 0 18px">
            <a href="${link}" style="display:inline-block;background:#0f274f;color:#ffffff;padding:11px 16px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">
              View game details
            </a>
          </p>
          <p style="margin:0 0 14px;color:#64748b;font-size:12px;line-height:1.6">
            Bookmark or save this email to access your game even after clearing your browser.
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

function paymentConfirmedEmailText(opts: {
  name: string;
  game: Game;
  headCount: number;
  totalPaid: number;
  gameUrl: string;
  policiesUrl: string;
}): string {
  const courtLine = formatGameCourtLine(opts.game.court);
  const when = `${formatGameDateLong(opts.game.date)} · ${formatGameTimeRangeLabel(opts.game)}`;
  return [
    `Hi ${opts.name},`,
    ``,
    `Your payment has been received and verified. You're confirmed for ${opts.game.location}.`,
    when,
    ...(courtLine ? [courtLine] : []),
    ``,
    `Group size: ${opts.headCount}`,
    `Amount paid: $${opts.totalPaid.toFixed(2)}`,
    ``,
    `View game details: ${opts.gameUrl}`,
    ``,
    `Bookmark or save this email to access your game even after clearing your browser.`,
    playerEmailLegalFooterText({
      policiesUrl: opts.policiesUrl,
      waiverAccepted: true,
    }),
  ].join("\n");
}

async function sendPaymentConfirmationEmail(
  admin: AdminSupabaseClient,
  signup: Pick<Signup, "id" | "email" | "payment_code" | "game_id">
): Promise<void> {
  const { data: signupFull } = await admin
    .from("signups")
    .select("*")
    .eq("id", signup.id)
    .single();
  if (!signupFull) return;

  const { data: gameRow } = await admin
    .from("games")
    .select("*")
    .eq("id", signup.game_id)
    .single();
  if (!gameRow) return;

  const game = normalizeGame(gameRow as Game);
  const s = signupFull as Signup;
  const headCount = 1 + (s.friends?.length ?? 0);
  const totalPaid = Math.round(Number(game.price) * headCount * 100) / 100;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const gameUrl = new URL(`/app/games/${game.id}`, appUrl).toString();
  const policiesUrl = playerPoliciesAbsoluteUrl();

  const opts = {
    name: s.name,
    game,
    headCount,
    totalPaid,
    gameUrl,
    policiesUrl,
  };

  await sendTransactionalEmail({
    to: s.email,
    subject: `6IX BACK Volleyball → payment confirmed for ${game.location}`,
    html: paymentConfirmedEmailHtml(opts),
    text: paymentConfirmedEmailText(opts),
  });
}

export async function syncPaidSignupsFromGmail(
  admin: AdminSupabaseClient,
  origin: string
): Promise<number> {
  const { data: signups, error: signupsError } = await admin
    .from("signups")
    .select("id, game_id, email, paid, payment_code")
    .eq("paid", false)
    .not("payment_code", "is", null);

  if (signupsError) throw new Error(signupsError.message);

  const pending = (signups ?? []) as Pick<
    Signup,
    "id" | "game_id" | "email" | "paid" | "payment_code"
  >[];

  const now = new Date().toISOString();

  if (pending.length === 0) {
    await admin
      .from("admin_settings")
      .update({ last_synced_at: now, last_sync_matched: 0 })
      .eq("id", 1);
    return 0;
  }

  const { data: settings, error: settingsError } = await admin
    .from("admin_settings")
    .select(
      "gmail_refresh_token, gmail_connected_email, gmail_assumed_expires_at, gmail_reauth_required"
    )
    .eq("id", 1)
    .maybeSingle<AdminSettingsRow>();

  if (settingsError) throw new Error(settingsError.message);

  const universal = settings ?? null;
  const gameIds = [...new Set(pending.map((p) => p.game_id))];

  const { data: configs, error: configError } = await admin
    .from("game_email_sync_config")
    .select("game_id, preferred_gmail_connection_id, use_universal_fallback")
    .in("game_id", gameIds);

  if (configError) throw new Error(configError.message);

  const configByGame = new Map(
    (configs ?? []).map((c) => [c.game_id as string, c as GameEmailSyncConfigRow])
  );

  const connIds = [
    ...new Set(
      (configs ?? [])
        .map((c) => c.preferred_gmail_connection_id as string | null)
        .filter(Boolean) as string[]
    ),
  ];

  const connById = new Map<string, GmailConnectionRow>();
  if (connIds.length > 0) {
    const { data: conns, error: connErr } = await admin
      .from("gmail_connections")
      .select(
        "id, gmail_refresh_token, gmail_connected_email, gmail_assumed_expires_at, gmail_provider_refresh_expires_at, reauth_required, last_successful_refresh_at, gmail_connected_at"
      )
      .in("id", connIds);
    if (connErr) throw new Error(connErr.message);
    for (const row of conns ?? []) {
      connById.set((row as GmailConnectionRow).id, row as GmailConnectionRow);
    }
  }

  const groups = new Map<string, FetchGroup>();
  for (const gameId of gameIds) {
    const eff = resolveEffectiveInbox(
      gameId,
      configByGame.get(gameId),
      connById,
      universal
    );
    if (!eff) continue;
    upsertFetchGroup(groups, eff.refreshToken, eff.kind, eff.connectionId, gameId);
  }

  if (groups.size === 0) {
    await admin
      .from("admin_settings")
      .update({ last_synced_at: now, last_sync_matched: 0 })
      .eq("id", 1);
    return 0;
  }

  const hitsByRefreshToken = new Map<string, GmailCodeHit[]>();
  for (const group of groups.values()) {
    try {
      const hits = await findCodeHits(group.refreshToken, origin);
      hitsByRefreshToken.set(group.refreshToken, hits);
      const refreshedAt = new Date().toISOString();
      if (group.isUniversal) {
        await admin
          .from("admin_settings")
          .update({
            gmail_last_successful_refresh_at: refreshedAt,
            gmail_reauth_required: false,
          })
          .eq("id", 1);
      }
      for (const cid of group.connectionIds) {
        await admin
          .from("gmail_connections")
          .update({
            last_successful_refresh_at: refreshedAt,
            reauth_required: false,
          })
          .eq("id", cid);
      }
    } catch (err) {
      if (!isInvalidGrantError(err)) throw err;
      if (group.isUniversal) {
        await markUniversalGmailReauthRequiredAndNotify(admin, origin, {
          connectedEmail: universal?.gmail_connected_email ?? null,
        });
      } else {
        for (const cid of group.connectionIds) {
          const conn = connById.get(cid);
          await markGameGmailReauthRequiredAndNotify(admin, origin, {
            connectionId: cid,
            gameId: group.sampleGameId,
            connectedEmail: conn?.gmail_connected_email ?? null,
          });
        }
      }
      hitsByRefreshToken.set(group.refreshToken, []);
    }
  }

  const hitByCode = new Map<string, GmailCodeHit>();
  for (const group of groups.values()) {
    const hits = hitsByRefreshToken.get(group.refreshToken) ?? [];
    for (const hit of hits) {
      if (!hitByCode.has(hit.code)) hitByCode.set(hit.code, hit);
    }
  }

  const testMode = process.env.GMAIL_SYNC_TEST_MODE === "true";

  let matched = 0;
  const confirmedSignups: typeof pending = [];
  for (const signup of pending) {
    const code = signup.payment_code?.toUpperCase();
    if (!code) continue;
    const hit = hitByCode.get(code);
    if (!hit) continue;

    if (testMode) {
      if (signup.email.toLowerCase() !== hit.senderEmail) continue;
    } else {
      if (hit.senderEmail !== INTERAC_SENDER) continue;
    }

    const { error } = await admin
      .from("signups")
      .update({
        paid: true,
        payment_verified_at: now,
        payment_email_id: hit.messageId,
      })
      .eq("id", signup.id)
      .eq("paid", false);
    if (!error) {
      matched += 1;
      confirmedSignups.push(signup);
    }
  }

  for (const signup of confirmedSignups) {
    try {
      await sendPaymentConfirmationEmail(admin, signup);
    } catch (e) {
      console.error(`Failed to send confirmation email for signup ${signup.id}:`, e);
    }
  }

  await admin
    .from("admin_settings")
    .update({ last_synced_at: now, last_sync_matched: matched })
    .eq("id", 1);
  return matched;
}
