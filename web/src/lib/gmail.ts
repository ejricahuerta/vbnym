import { google } from "googleapis";

import {
  buildHostPendingReminderEmailTemplate,
  buildPlayerPaymentConfirmedEmailTemplate,
  buildPlayerPendingReminderEmailTemplate,
} from "@/lib/email-templates";
import { appOrigin, requiredEnv } from "@/lib/env";
import { hostGmailConnectionId } from "@/lib/host-gmail";
import { createPlayerCancelSignupLinkToken } from "@/lib/magic-link";
import { extractPaymentCodes } from "@/lib/payment-code";
import { PAYMENT_CODE_EXPIRY_MINUTES } from "@/lib/registration-policy";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { createServerSupabase } from "@/lib/supabase-server";

const INTERAC_SENDER = "notify@payments.interac.ca";

type GmailMessageHit = {
  code: string;
  messageId: string;
  senderEmail: string;
};

type GmailConnectionRow = {
  id: string;
  refresh_token: string | null;
};

type SignupRow = {
  id: string;
  game_id: string;
  payment_code: string;
  player_email: string;
  player_name: string;
  created_at: string;
  payment_status: "paid" | "pending" | "refund" | "canceled";
};

type GameRow = {
  id: string;
  title: string;
  starts_at: string;
  host_name: string;
  host_email: string;
  price_cents: number;
  signed_count: number;
};

export function createGoogleOAuthClient(redirectUri?: string) {
  return new google.auth.OAuth2(
    requiredEnv("GOOGLE_OAUTH_CLIENT_ID"),
    requiredEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    redirectUri ?? requiredEnv("GOOGLE_REDIRECT_URI")
  );
}

export async function fetchRecentPaymentCodes(accessToken: string): Promise<string[]> {
  const auth = createGoogleOAuthClient();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });
  const list = await gmail.users.messages.list({
    userId: "me",
    q: 'newer_than:14d ("6B-")',
    maxResults: 20,
  });
  const ids = list.data.messages?.map((message: { id?: string | null }) => message.id).filter(Boolean) as string[];
  const found = new Set<string>();
  for (const id of ids) {
    const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
    const parts = msg.data.payload?.parts ?? [];
    const textChunks = [
      msg.data.snippet ?? "",
      ...parts.map((part: { body?: { data?: string | null } }) =>
        Buffer.from(part.body?.data ?? "", "base64").toString("utf8")
      ),
    ];
    for (const chunk of textChunks) {
      for (const code of extractPaymentCodes(chunk)) {
        found.add(code);
      }
    }
  }
  return Array.from(found);
}

function isInvalidGrantError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("invalid_grant");
}

function parseSenderEmail(raw: string | null | undefined): string {
  if (!raw) return "";
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase().replace(/^"|"$/g, "");
}

function extractCodes(raw: string): string[] {
  const normalized = raw.toUpperCase();
  const legacy = normalized.match(/\b(?:NYM|6IX)-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g) ?? [];
  return [...new Set([...extractPaymentCodes(normalized), ...legacy])];
}

function shouldAcceptSender(senderEmail: string, signupEmail: string): boolean {
  const testMode = process.env.GMAIL_SYNC_TEST_MODE?.trim() === "true";
  if (testMode) {
    return senderEmail === signupEmail.trim().toLowerCase();
  }
  return senderEmail === INTERAC_SENDER;
}

async function findRecentPaymentHits(refreshToken: string): Promise<GmailMessageHit[]> {
  const auth = createGoogleOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  await auth.getAccessToken();
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    q: 'newer_than:30d ("6B-" OR "6IX-" OR "NYM-")',
    maxResults: 100,
  });

  const ids = list.data.messages?.map((message: { id?: string | null }) => message.id).filter(Boolean) as string[];
  const hits: GmailMessageHit[] = [];
  for (const id of ids) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "metadata",
      metadataHeaders: ["From", "Subject"],
    });
    const headers = msg.data.payload?.headers ?? [];
    const fromHeader =
      headers.find((h: { name?: string | null; value?: string | null }) => h.name?.toLowerCase() === "from")
        ?.value ?? "";
    const subject =
      headers.find((h: { name?: string | null; value?: string | null }) => h.name?.toLowerCase() === "subject")
        ?.value ?? "";
    const snippet = msg.data.snippet ?? "";
    const senderEmail = parseSenderEmail(fromHeader);
    const codes = extractCodes(`${subject}\n${snippet}`);
    for (const code of codes) {
      hits.push({ code, messageId: id, senderEmail });
    }
  }
  return hits;
}

export async function syncPaidSignupsFromGmail(): Promise<{ matched: number; expired: number; reminded: number }> {
  const supabase = createServerSupabase();

  const { data: liveGamesData } = await supabase
    .from("games")
    .select("id, host_email")
    .eq("status", "live");
  const liveGames = (liveGamesData ?? []) as { id: string; host_email: string }[];
  if (liveGames.length === 0) return { matched: 0, expired: 0, reminded: 0 };

  const gamesByHost = new Map<string, string[]>();
  for (const game of liveGames) {
    const host = game.host_email?.trim().toLowerCase() ?? "";
    if (!host) continue;
    const list = gamesByHost.get(host) ?? [];
    list.push(game.id);
    gamesByHost.set(host, list);
  }
  if (gamesByHost.size === 0) return { matched: 0, expired: 0, reminded: 0 };

  const hostConnectionIds = [...gamesByHost.keys()].map((host) => hostGmailConnectionId(host));
  const { data: activeConnections } = await supabase
    .from("gmail_connections")
    .select("id, refresh_token")
    .in("id", hostConnectionIds)
    .eq("active", true);

  const tokenByHost = new Map<string, string>();
  for (const row of (activeConnections ?? []) as GmailConnectionRow[]) {
    const refreshToken = row.refresh_token?.trim() ?? "";
    if (!refreshToken) continue;
    const host = String(row.id).replace(/^host:/, "");
    tokenByHost.set(host, refreshToken);
  }
  if (tokenByHost.size === 0) return { matched: 0, expired: 0, reminded: 0 };

  const gameIdsByHost = new Map<string, string[]>();
  const automatedGameIds: string[] = [];
  for (const [host, gameIds] of gamesByHost) {
    if (!tokenByHost.has(host)) continue;
    gameIdsByHost.set(host, gameIds);
    automatedGameIds.push(...gameIds);
  }
  if (automatedGameIds.length === 0) return { matched: 0, expired: 0, reminded: 0 };

  const [{ data: pendingRows }, { data: gamesData }] = await Promise.all([
    supabase
      .from("signups")
      .select("id, game_id, payment_code, player_email, player_name, created_at, payment_status")
      .in("game_id", automatedGameIds)
      .neq("payment_status", "paid")
      .eq("status", "active"),
    supabase
      .from("games")
      .select("id, title, starts_at, host_name, host_email, price_cents, signed_count")
      .in("id", automatedGameIds),
  ]);
  const pending = ((pendingRows ?? []) as SignupRow[]).filter((row) => Boolean(row.payment_code));
  if (pending.length === 0) return { matched: 0, expired: 0, reminded: 0 };
  const gameById = new Map(((gamesData ?? []) as GameRow[]).map((game) => [game.id, game]));

  let matched = 0;
  const matchedSignupIds = new Set<string>();

  for (const [host, gameIds] of gameIdsByHost) {
    const refreshToken = tokenByHost.get(host);
    if (!refreshToken) continue;
    const gameIdSet = new Set(gameIds);
    const hostSignups = pending.filter((row) => gameIdSet.has(row.game_id));
    if (hostSignups.length === 0) continue;

    const hitByCode = new Map<string, GmailMessageHit>();
    try {
      const hits = await findRecentPaymentHits(refreshToken);
      for (const hit of hits) {
        if (!hitByCode.has(hit.code)) hitByCode.set(hit.code, hit);
      }
    } catch (error) {
      if (!isInvalidGrantError(error)) throw error;
      continue;
    }

    for (const row of hostSignups) {
      const code = row.payment_code.toUpperCase();
      const hit = hitByCode.get(code);
      if (!hit) continue;
      if (!shouldAcceptSender(hit.senderEmail, row.player_email)) continue;
      const { data: updatedSignup, error } = await supabase
        .from("signups")
        .update({ payment_status: "paid" })
        .eq("id", row.id)
        .neq("payment_status", "paid")
        .select("id")
        .maybeSingle<{ id: string }>();
      if (!error && updatedSignup?.id) {
        matched += 1;
        matchedSignupIds.add(row.id);
        const game = gameById.get(row.game_id);
        if (game) {
          const cancelExpiryMs = Date.parse(game.starts_at) - 2 * 60 * 60 * 1000;
          const canCancel = Number.isFinite(cancelExpiryMs) && cancelExpiryMs > Date.now();
          const cancelToken = canCancel
            ? createPlayerCancelSignupLinkToken({
                gameId: game.id,
                signupId: row.id,
                playerEmail: row.player_email,
                expiresAtMs: cancelExpiryMs,
              })
            : null;
          const startsAtDisplay = new Date(game.starts_at).toLocaleString("en-CA", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          const template = buildPlayerPaymentConfirmedEmailTemplate({
            gameTitle: game.title,
            startsAtDisplay,
            playerName: row.player_name,
            hostName: game.host_name,
            hostEmail: game.host_email,
            amountCents: game.price_cents,
            sourceLabel: "the automated payment checker",
            canCancel: Boolean(cancelToken),
            cancellationUrl: cancelToken
              ? `${appOrigin().replace(/\/$/, "")}/api/signup/cancel?t=${encodeURIComponent(cancelToken)}`
              : null,
          });
          await sendTransactionalEmailResult({
            to: row.player_email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
        }
      }
      await supabase.from("payment_events").insert({
        game_id: row.game_id,
        signup_id: row.id,
        payment_code: code,
        source: "gmail",
        matched: !error,
        raw_payload: { messageId: hit.messageId, senderEmail: hit.senderEmail },
      });
    }
  }

  const nowMs = Date.now();
  const reminderAgeMs = 15 * 60 * 1000;
  const expiryAgeMs = PAYMENT_CODE_EXPIRY_MINUTES * 60 * 1000;
  const unpaidRows = pending.filter((row) => row.payment_status !== "paid" && !matchedSignupIds.has(row.id));
  const reminderCandidates = unpaidRows.filter((row) => {
    const age = nowMs - Date.parse(row.created_at);
    return Number.isFinite(age) && age >= reminderAgeMs && age < expiryAgeMs;
  });

  let reminded = 0;
  if (reminderCandidates.length > 0) {
    const reminderIds = reminderCandidates.map((row) => row.id);
    const { data: reminderEvents } = await supabase
      .from("payment_events")
      .select("signup_id")
      .eq("source", "pending-reminder")
      .in("signup_id", reminderIds);
    const alreadyReminded = new Set(
      (reminderEvents ?? []).map((row) => String((row as { signup_id: string | null }).signup_id ?? ""))
    );
    for (const row of reminderCandidates) {
      if (alreadyReminded.has(row.id)) continue;
      const game = gameById.get(row.game_id);
      if (!game) continue;
      const ageMs = nowMs - Date.parse(row.created_at);
      const remainingMinutes = Math.max(1, Math.ceil((expiryAgeMs - ageMs) / 60000));
      const startsAtDisplay = new Date(game.starts_at).toLocaleString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const playerTemplate = buildPlayerPendingReminderEmailTemplate({
        gameTitle: game.title,
        startsAtDisplay,
        playerName: row.player_name,
        hostName: game.host_name,
        hostEmail: game.host_email,
        paymentCode: row.payment_code,
        amountCents: game.price_cents,
        remainingMinutes,
      });
      const hostTemplate = buildHostPendingReminderEmailTemplate({
        gameTitle: game.title,
        startsAtDisplay,
        playerName: row.player_name,
        hostName: game.host_name,
        hostEmail: game.host_email,
        paymentCode: row.payment_code,
        amountCents: game.price_cents,
        remainingMinutes,
      });
      await Promise.all([
        sendTransactionalEmailResult({
          to: row.player_email,
          subject: playerTemplate.subject,
          html: playerTemplate.html,
          text: playerTemplate.text,
        }),
        sendTransactionalEmailResult({
          to: game.host_email,
          subject: hostTemplate.subject,
          html: hostTemplate.html,
          text: hostTemplate.text,
        }),
      ]);
      await supabase.from("payment_events").insert({
        game_id: row.game_id,
        signup_id: row.id,
        payment_code: row.payment_code.toUpperCase(),
        source: "pending-reminder",
        matched: false,
        raw_payload: { remainingMinutes },
      });
      reminded += 1;
    }
  }

  const expiryCandidates = unpaidRows.filter((row) => {
    const age = nowMs - Date.parse(row.created_at);
    return Number.isFinite(age) && age >= expiryAgeMs;
  });
  let expired = 0;
  const cancellationsByGame = new Map<string, number>();
  for (const row of expiryCandidates) {
    const { error } = await supabase
      .from("signups")
      .update({ status: "removed" })
      .eq("id", row.id)
      .eq("status", "active")
      .neq("payment_status", "paid");
    if (error) continue;
    expired += 1;
    cancellationsByGame.set(row.game_id, (cancellationsByGame.get(row.game_id) ?? 0) + 1);
    await supabase.from("payment_events").insert({
      game_id: row.game_id,
      signup_id: row.id,
      payment_code: row.payment_code.toUpperCase(),
      source: "auto-cancel",
      matched: false,
      raw_payload: { reason: "pending_payment_window_elapsed" },
    });
  }
  for (const [gameId, cancellationCount] of cancellationsByGame) {
    const game = gameById.get(gameId);
    if (!game) continue;
    await supabase
      .from("games")
      .update({ signed_count: Math.max(0, game.signed_count - cancellationCount) })
      .eq("id", gameId);
  }

  return { matched, expired, reminded };
}
