import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function toBase32(buffer: Buffer, length: number): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return result.slice(0, length).toUpperCase();
}

export function generatePaymentCode(
  runId: string,
  signupId: string,
  email: string,
  secret: string
): string {
  const payload = `${runId}:${signupId}:${email.toLowerCase()}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const hash = hmac.digest();
  const code = toBase32(hash.subarray(0, 5), 8);
  return `NYM-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}
