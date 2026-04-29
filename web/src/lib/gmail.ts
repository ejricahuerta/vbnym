import { google } from "googleapis";

import {
  buildHostPendingReminderEmailTemplate,
  buildPlayerPaymentConfirmedEmailTemplate,
  buildPlayerPendingReminderEmailTemplate,
} from "@/lib/email-templates";
import { appOrigin, requiredEnv } from "@/lib/env";
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

export type GmailOAuthStateV1 = {
  v: 1;
  csrf?: string;
  mode: "universal" | "game";
  gameId?: string;
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

export function encodeGmailOAuthState(payload: GmailOAuthStateV1): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeGmailOAuthState(raw: string | null): GmailOAuthStateV1 | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as GmailOAuthStateV1;
    if (parsed.v !== 1) return null;
    if (parsed.mode !== "universal" && parsed.mode !== "game") return null;
    if (parsed.mode === "game" && !parsed.gameId?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function syncPaidSignupsFromGmail(): Promise<{ matched: number; expired: number; reminded: number }> {
  const supabase = createServerSupabase();
  const { data: syncRows } = await supabase
    .from("game_email_sync_config")
    .select("game_id, preferred_gmail_connection_id")
    .not("preferred_gmail_connection_id", "is", null);
  const configRows = (syncRows ?? []) as { game_id: string; preferred_gmail_connection_id: string | null }[];
  const preferredConnectionIds = [
    ...new Set(configRows.map((row) => row.preferred_gmail_connection_id?.trim() ?? "").filter(Boolean)),
  ];
  if (preferredConnectionIds.length === 0) return { matched: 0, expired: 0, reminded: 0 };

  const { data: activeConnections } = await supabase
    .from("gmail_connections")
    .select("id, refresh_token")
    .in("id", preferredConnectionIds)
    .eq("active", true);
  const connectionRows = (activeConnections ?? []) as GmailConnectionRow[];
  const activeConnectionIds = new Set(connectionRows.map((row) => row.id));
  const automatedGameIds = configRows
    .filter((row) => {
      const id = row.preferred_gmail_connection_id?.trim() ?? "";
      return Boolean(id) && activeConnectionIds.has(id);
    })
    .map((row) => row.game_id);
  if (automatedGameIds.length === 0) return { matched: 0, expired: 0, reminded: 0 };

  const refreshTokens = [
    ...new Set(
      connectionRows
        .map((row) => row.refresh_token?.trim() ?? "")
        .filter((row): row is string => Boolean(row))
    ),
  ];
  if (refreshTokens.length === 0) return { matched: 0, expired: 0, reminded: 0 };

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

  const hitByCode = new Map<string, GmailMessageHit>();
  for (const token of refreshTokens) {
    try {
      const hits = await findRecentPaymentHits(token);
      for (const hit of hits) {
        if (!hitByCode.has(hit.code)) hitByCode.set(hit.code, hit);
      }
    } catch (error) {
      if (!isInvalidGrantError(error)) throw error;
    }
  }

  let matched = 0;
  const matchedSignupIds = new Set<string>();
  for (const row of pending) {
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
      .update({ status: "canceled" })
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
