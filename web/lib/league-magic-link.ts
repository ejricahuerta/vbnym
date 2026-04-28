import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  LEAGUE_PORTAL_MAGIC_LINK_TTL_MS,
  LEAGUE_PORTAL_SESSION_MAX_AGE_SEC,
} from "@/lib/league-portal-cookie";

const LINK_KIND = "league_link" as const;
const SESSION_KIND = "league_session" as const;

type LinkPayload = {
  v: 1;
  k: typeof LINK_KIND;
  email: string;
  exp: number;
};

type SessionPayload = {
  v: 1;
  k: typeof SESSION_KIND;
  email: string;
  exp: number;
};

function getSecret(): string | null {
  const s = process.env.PLAYER_AUTH_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

function signBody(bodyUtf8: string, secret: string): string {
  return createHmac("sha256", secret).update(bodyUtf8).digest("base64url");
}

function encodeToken(body: object, secret: string): string {
  const bodyUtf8 = JSON.stringify(body);
  const sig = signBody(bodyUtf8, secret);
  return `${Buffer.from(bodyUtf8, "utf8").toString("base64url")}.${sig}`;
}

function decodeToken(token: string): { bodyUtf8: string; sig: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const bodyB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const bodyUtf8 = Buffer.from(bodyB64, "base64url").toString("utf8");
    return { bodyUtf8, sig };
  } catch {
    return null;
  }
}

function timingSafeSigEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "base64url");
    const bb = Buffer.from(b, "base64url");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function createLeaguePortalMagicLinkToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  const body: LinkPayload = {
    v: 1,
    k: LINK_KIND,
    email: normalized,
    exp: Date.now() + LEAGUE_PORTAL_MAGIC_LINK_TTL_MS,
  };
  return encodeToken(body, secret);
}

export function verifyLeaguePortalMagicLinkToken(
  token: string
): { email: string } | null {
  const secret = getSecret();
  if (!secret) return null;
  const parts = decodeToken(token.trim());
  if (!parts) return null;
  const expected = signBody(parts.bodyUtf8, secret);
  if (!timingSafeSigEqual(expected, parts.sig)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(parts.bodyUtf8) as LinkPayload;
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as LinkPayload).v !== 1 ||
    (parsed as LinkPayload).k !== LINK_KIND
  ) {
    return null;
  }
  const p = parsed as LinkPayload;
  if (typeof p.email !== "string" || !p.email.includes("@")) return null;
  if (typeof p.exp !== "number" || !Number.isFinite(p.exp) || p.exp <= Date.now()) {
    return null;
  }
  return { email: p.email.trim().toLowerCase() };
}

export function createLeaguePortalSessionToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  const body: SessionPayload = {
    v: 1,
    k: SESSION_KIND,
    email: normalized,
    exp: Date.now() + LEAGUE_PORTAL_SESSION_MAX_AGE_SEC * 1000,
  };
  return encodeToken(body, secret);
}

export function verifyLeaguePortalSessionToken(
  token: string | undefined | null
): { email: string } | null {
  if (!token?.trim()) return null;
  const secret = getSecret();
  if (!secret) return null;
  const parts = decodeToken(token.trim());
  if (!parts) return null;
  const expected = signBody(parts.bodyUtf8, secret);
  if (!timingSafeSigEqual(expected, parts.sig)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(parts.bodyUtf8) as SessionPayload;
  } catch {
    return null;
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as SessionPayload).v !== 1 ||
    (parsed as SessionPayload).k !== SESSION_KIND
  ) {
    return null;
  }
  const p = parsed as SessionPayload;
  if (typeof p.email !== "string" || !p.email.includes("@")) return null;
  if (typeof p.exp !== "number" || !Number.isFinite(p.exp) || p.exp <= Date.now()) {
    return null;
  }
  return { email: p.email.trim().toLowerCase() };
}
