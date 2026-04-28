import { google } from "googleapis";

import { requiredEnv } from "@/lib/env";
import { extractPaymentCodes } from "@/lib/payment-code";
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

export async function syncPaidSignupsFromGmail(): Promise<number> {
  const supabase = createServerSupabase();
  const { data: connections } = await supabase
    .from("gmail_connections")
    .select("id, refresh_token")
    .eq("active", true);

  const connectionRows = (connections ?? []) as GmailConnectionRow[];
  const refreshTokens = [...new Set(connectionRows.map((row) => row.refresh_token).filter((row): row is string => Boolean(row)))];
  if (refreshTokens.length === 0) return 0;

  const { data: pendingRows } = await supabase
    .from("signups")
    .select("id, game_id, payment_code, player_email")
    .neq("payment_status", "paid")
    .eq("status", "active");
  const pending = ((pendingRows ?? []) as SignupRow[]).filter((row) => Boolean(row.payment_code));
  if (pending.length === 0) return 0;

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
  for (const row of pending) {
    const code = row.payment_code.toUpperCase();
    const hit = hitByCode.get(code);
    if (!hit) continue;
    if (!shouldAcceptSender(hit.senderEmail, row.player_email)) continue;
    const { error } = await supabase
      .from("signups")
      .update({ payment_status: "paid" })
      .eq("id", row.id)
      .neq("payment_status", "paid");
    if (!error) matched += 1;
    await supabase.from("payment_events").insert({
      game_id: row.game_id,
      signup_id: row.id,
      payment_code: code,
      source: "gmail",
      matched: !error,
      raw_payload: { messageId: hit.messageId, senderEmail: hit.senderEmail },
    });
  }
  return matched;
}
