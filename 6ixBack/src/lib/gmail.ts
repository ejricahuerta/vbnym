import { google } from "googleapis";

import { requiredEnv } from "@/lib/env";
import { extractPaymentCodes } from "@/lib/payment-code";

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
  const ids = list.data.messages?.map((message) => message.id).filter(Boolean) as string[];
  const found = new Set<string>();
  for (const id of ids) {
    const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
    const parts = msg.data.payload?.parts ?? [];
    const textChunks = [
      msg.data.snippet ?? "",
      ...parts.map((part) => Buffer.from(part.body?.data ?? "", "base64").toString("utf8")),
    ];
    for (const chunk of textChunks) {
      for (const code of extractPaymentCodes(chunk)) {
        found.add(code);
      }
    }
  }
  return Array.from(found);
}
