import { randomBytes } from "node:crypto";

/** Human-ish reference for e-transfer memos (alphanumeric, no ambiguous chars). */
export function createLeaguePaymentReferenceCode(): string {
  const raw = randomBytes(5).toString("hex").toUpperCase();
  return `L-${raw.slice(0, 4)}-${raw.slice(4)}`;
}
