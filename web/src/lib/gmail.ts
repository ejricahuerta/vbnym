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

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const current = index;
      index += 1;
      if (current >= items.length) return;
      results[current] = await mapper(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

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
  const messages = await mapWithConcurrency(ids, 6, async (id) =>
    gmail.users.messages.get({ userId: "me", id, format: "full" })
  );
  for (const msg of messages) {
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
  const messages = await mapWithConcurrency(ids, 6, async (id) =>
    gmail.users.messages.get({
      userId: "me",
      id,
      format: "metadata",
      metadataHeaders: ["From", "Subject"],
    })
  );
  for (const msg of messages) {
    const messageId = msg.data.id ?? "";
    if (!messageId) continue;
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
      hits.push({ code, messageId, senderEmail });
    }
  }
  return hits;
}

export async function syncPaidSignupsFromGmail(): Promise<{ matched: number; expired: number; reminded: number }> {
  const supabase = createServerSupabase();
  const inQueryChunkSize = 400;

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

  const pendingChunks = await Promise.all(
    chunkArray(automatedGameIds, inQueryChunkSize).map(async (gameIdsChunk) => {
      const { data } = await supabase
        .from("signups")
        .select("id, game_id, payment_code, player_email, player_name, created_at, payment_status")
        .in("game_id", gameIdsChunk)
        .neq("payment_status", "paid")
        .eq("status", "active");
      return (data ?? []) as SignupRow[];
    })
  );
  const gameChunks = await Promise.all(
    chunkArray(automatedGameIds, inQueryChunkSize).map(async (gameIdsChunk) => {
      const { data } = await supabase
        .from("games")
        .select("id, title, starts_at, host_name, host_email, price_cents, signed_count")
        .in("id", gameIdsChunk);
      return (data ?? []) as GameRow[];
    })
  );
  const pending = pendingChunks.flat().filter((row) => Boolean(row.payment_code));
  if (pending.length === 0) return { matched: 0, expired: 0, reminded: 0 };
  const gameById = new Map(gameChunks.flat().map((game) => [game.id, game]));
  const pendingByGameId = new Map<string, SignupRow[]>();
  for (const row of pending) {
    const rows = pendingByGameId.get(row.game_id) ?? [];
    rows.push(row);
    pendingByGameId.set(row.game_id, rows);
  }

  let matched = 0;
  const matchedSignupIds = new Set<string>();

  for (const [host, gameIds] of gameIdsByHost) {
    const refreshToken = tokenByHost.get(host);
    if (!refreshToken) continue;
    const hostSignups = gameIds.flatMap((gameId) => pendingByGameId.get(gameId) ?? []);
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

    const paymentEvents: Array<{
      game_id: string;
      signup_id: string;
      payment_code: string;
      source: string;
      matched: boolean;
      raw_payload: { messageId: string; senderEmail: string };
    }> = [];
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
      paymentEvents.push({
        game_id: row.game_id,
        signup_id: row.id,
        payment_code: code,
        source: "gmail",
        matched: !error,
        raw_payload: { messageId: hit.messageId, senderEmail: hit.senderEmail },
      });
    }
    for (const batch of chunkArray(paymentEvents, 250)) {
      if (batch.length > 0) {
        await supabase.from("payment_events").insert(batch);
      }
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
    const reminderEventsChunks = await Promise.all(
      chunkArray(reminderIds, inQueryChunkSize).map(async (idsChunk) => {
        const { data } = await supabase
          .from("payment_events")
          .select("signup_id")
          .eq("source", "pending-reminder")
          .in("signup_id", idsChunk);
        return data ?? [];
      })
    );
    const alreadyReminded = new Set(
      reminderEventsChunks
        .flat()
        .map((row) => String((row as { signup_id: string | null }).signup_id ?? ""))
    );
    const reminderEventsToInsert: Array<{
      game_id: string;
      signup_id: string;
      payment_code: string;
      source: string;
      matched: boolean;
      raw_payload: { remainingMinutes: number };
    }> = [];
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
      reminderEventsToInsert.push({
        game_id: row.game_id,
        signup_id: row.id,
        payment_code: row.payment_code.toUpperCase(),
        source: "pending-reminder",
        matched: false,
        raw_payload: { remainingMinutes },
      });
      reminded += 1;
    }
    for (const batch of chunkArray(reminderEventsToInsert, 250)) {
      if (batch.length > 0) {
        await supabase.from("payment_events").insert(batch);
      }
    }
  }

  const expiryCandidates = unpaidRows.filter((row) => {
    const age = nowMs - Date.parse(row.created_at);
    return Number.isFinite(age) && age >= expiryAgeMs;
  });
  let expired = 0;
  const cancellationsByGame = new Map<string, number>();
  for (const chunk of chunkArray(expiryCandidates, 250)) {
    const expiryIds = chunk.map((row) => row.id);
    const { data: updatedRows } = await supabase
      .from("signups")
      .update({ status: "removed" })
      .in("id", expiryIds)
      .eq("status", "active")
      .neq("payment_status", "paid")
      .select("id, game_id");
    const updatedIdSet = new Set(((updatedRows ?? []) as Array<{ id: string; game_id: string }>).map((row) => row.id));
    const events = [];
    for (const row of chunk) {
      if (!updatedIdSet.has(row.id)) continue;
      expired += 1;
      cancellationsByGame.set(row.game_id, (cancellationsByGame.get(row.game_id) ?? 0) + 1);
      events.push({
        game_id: row.game_id,
        signup_id: row.id,
        payment_code: row.payment_code.toUpperCase(),
        source: "auto-cancel",
        matched: false,
        raw_payload: { reason: "pending_payment_window_elapsed" },
      });
    }
    if (events.length > 0) {
      await supabase.from("payment_events").insert(events);
    }
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
