import { createHmac } from "node:crypto";

import { requiredEnv } from "@/lib/env";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function toShortCode(input: Buffer): string {
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    out += ALPHABET[input[i] % ALPHABET.length];
  }
  return out;
}

export function generatePaymentCode(opts: { gameId: string; signupId: string; playerEmail: string }): string {
  const secret = requiredEnv("PAYMENT_CODE_SECRET");
  const digest = createHmac("sha256", secret)
    .update(`${opts.gameId}:${opts.signupId}:${opts.playerEmail.toLowerCase().trim()}`)
    .digest();
  const short = toShortCode(digest);
  return `6B-${short.slice(0, 4)}-${short.slice(4, 8)}`;
}

export function extractPaymentCodes(raw: string): string[] {
  return raw.match(/\b6B-[A-Z0-9]{4}-[A-Z0-9]{4}\b/g) ?? [];
}
