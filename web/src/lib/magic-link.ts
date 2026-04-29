import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  MAGIC_ADMIN_SESSION_MAX_AGE_SEC,
  MAGIC_HOST_SESSION_MAX_AGE_SEC,
  MAGIC_LINK_TTL_MS,
  MAGIC_PLAYER_SESSION_MAX_AGE_SEC,
} from "@/lib/magic-auth-cookies";

export const HOST_LINK_KIND = "host_link" as const;
export const PLAYER_LINK_KIND = "player_link" as const;
export const ADMIN_LINK_KIND = "admin_link" as const;
export const HOST_SESSION_KIND = "host_session" as const;
export const PLAYER_SESSION_KIND = "player_session" as const;
export const ADMIN_SESSION_KIND = "admin_session" as const;
export const PLAYER_CANCEL_SIGNUP_LINK_KIND = "player_cancel_signup_link" as const;

type HostLinkPayload = {
  v: 1;
  k: typeof HOST_LINK_KIND;
  email: string;
  exp: number;
};

type PlayerLinkPayload = {
  v: 1;
  k: typeof PLAYER_LINK_KIND;
  email: string;
  exp: number;
};

type HostSessionPayload = {
  v: 1;
  k: typeof HOST_SESSION_KIND;
  email: string;
  exp: number;
};

type PlayerSessionPayload = {
  v: 1;
  k: typeof PLAYER_SESSION_KIND;
  email: string;
  exp: number;
};

type AdminLinkPayload = {
  v: 1;
  k: typeof ADMIN_LINK_KIND;
  email: string;
  exp: number;
};

type AdminSessionPayload = {
  v: 1;
  k: typeof ADMIN_SESSION_KIND;
  email: string;
  exp: number;
};

type PlayerCancelSignupLinkPayload = {
  v: 1;
  k: typeof PLAYER_CANCEL_SIGNUP_LINK_KIND;
  gameId: string;
  signupId: string;
  playerEmail: string;
  exp: number;
};

function getSecret(): string | null {
  const s = process.env.MAGIC_AUTH_SECRET?.trim();
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

export function createHostMagicLinkToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  const body: HostLinkPayload = {
    v: 1,
    k: HOST_LINK_KIND,
    email: normalized,
    exp: Date.now() + MAGIC_LINK_TTL_MS,
  };
  return encodeToken(body, secret);
}

export function verifyHostMagicLinkToken(token: string): { email: string } | null {
  return verifyLinkToken(token, HOST_LINK_KIND);
}

export function createPlayerMagicLinkToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  const body: PlayerLinkPayload = {
    v: 1,
    k: PLAYER_LINK_KIND,
    email: normalized,
    exp: Date.now() + MAGIC_LINK_TTL_MS,
  };
  return encodeToken(body, secret);
}

export function verifyPlayerMagicLinkToken(token: string): { email: string } | null {
  return verifyLinkToken(token, PLAYER_LINK_KIND);
}

export function createAdminMagicLinkToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  const body: AdminLinkPayload = {
    v: 1,
    k: ADMIN_LINK_KIND,
    email: normalized,
    exp: Date.now() + MAGIC_LINK_TTL_MS,
  };
  return encodeToken(body, secret);
}

export function verifyAdminMagicLinkToken(token: string): { email: string } | null {
  return verifyLinkToken(token, ADMIN_LINK_KIND);
}

function verifyLinkToken(
  token: string,
  expectedKind: typeof HOST_LINK_KIND | typeof PLAYER_LINK_KIND | typeof ADMIN_LINK_KIND
): { email: string } | null {
  const secret = getSecret();
  if (!secret) return null;
  const parts = decodeToken(token.trim());
  if (!parts) return null;
  const expected = signBody(parts.bodyUtf8, secret);
  if (!timingSafeSigEqual(expected, parts.sig)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(parts.bodyUtf8);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as { v?: number; k?: string; email?: string; exp?: number };
  if (p.v !== 1 || p.k !== expectedKind) return null;
  if (typeof p.email !== "string" || !p.email.includes("@")) return null;
  if (typeof p.exp !== "number" || !Number.isFinite(p.exp) || p.exp <= Date.now()) {
    return null;
  }
  return { email: p.email.trim().toLowerCase() };
}

export function createHostSessionToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  const body: HostSessionPayload = {
    v: 1,
    k: HOST_SESSION_KIND,
    email: normalized,
    exp: Date.now() + MAGIC_HOST_SESSION_MAX_AGE_SEC * 1000,
  };
  return encodeToken(body, secret);
}

export function verifyHostSessionToken(
  token: string | undefined | null
): { email: string } | null {
  return verifySessionToken(token, HOST_SESSION_KIND);
}

export function createPlayerSessionToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  const body: PlayerSessionPayload = {
    v: 1,
    k: PLAYER_SESSION_KIND,
    email: normalized,
    exp: Date.now() + MAGIC_PLAYER_SESSION_MAX_AGE_SEC * 1000,
  };
  return encodeToken(body, secret);
}

export function verifyPlayerSessionToken(
  token: string | undefined | null
): { email: string } | null {
  return verifySessionToken(token, PLAYER_SESSION_KIND);
}

export function createAdminSessionToken(email: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  const body: AdminSessionPayload = {
    v: 1,
    k: ADMIN_SESSION_KIND,
    email: normalized,
    exp: Date.now() + MAGIC_ADMIN_SESSION_MAX_AGE_SEC * 1000,
  };
  return encodeToken(body, secret);
}

export function createPlayerCancelSignupLinkToken(input: {
  gameId: string;
  signupId: string;
  playerEmail: string;
  expiresAtMs: number;
}): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const body: PlayerCancelSignupLinkPayload = {
    v: 1,
    k: PLAYER_CANCEL_SIGNUP_LINK_KIND,
    gameId: input.gameId.trim(),
    signupId: input.signupId.trim(),
    playerEmail: input.playerEmail.trim().toLowerCase(),
    exp: input.expiresAtMs,
  };
  if (!body.gameId || !body.signupId || !body.playerEmail.includes("@")) return null;
  if (!Number.isFinite(body.exp) || body.exp <= Date.now()) return null;
  return encodeToken(body, secret);
}

export function verifyPlayerCancelSignupLinkToken(
  token: string | undefined | null
): { gameId: string; signupId: string; playerEmail: string; exp: number } | null {
  if (!token?.trim()) return null;
  const secret = getSecret();
  if (!secret) return null;
  const parts = decodeToken(token.trim());
  if (!parts) return null;
  const expected = signBody(parts.bodyUtf8, secret);
  if (!timingSafeSigEqual(expected, parts.sig)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(parts.bodyUtf8);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as {
    v?: number;
    k?: string;
    gameId?: string;
    signupId?: string;
    playerEmail?: string;
    exp?: number;
  };
  if (p.v !== 1 || p.k !== PLAYER_CANCEL_SIGNUP_LINK_KIND) return null;
  if (typeof p.gameId !== "string" || !p.gameId.trim()) return null;
  if (typeof p.signupId !== "string" || !p.signupId.trim()) return null;
  if (typeof p.playerEmail !== "string" || !p.playerEmail.includes("@")) return null;
  if (typeof p.exp !== "number" || !Number.isFinite(p.exp) || p.exp <= Date.now()) return null;
  return {
    gameId: p.gameId.trim(),
    signupId: p.signupId.trim(),
    playerEmail: p.playerEmail.trim().toLowerCase(),
    exp: p.exp,
  };
}

export function verifyAdminSessionToken(
  token: string | undefined | null
): { email: string } | null {
  return verifySessionToken(token, ADMIN_SESSION_KIND);
}

function verifySessionToken(
  token: string | undefined | null,
  expectedKind: typeof HOST_SESSION_KIND | typeof PLAYER_SESSION_KIND | typeof ADMIN_SESSION_KIND
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
    parsed = JSON.parse(parts.bodyUtf8);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as { v?: number; k?: string; email?: string; exp?: number };
  if (p.v !== 1 || p.k !== expectedKind) return null;
  if (typeof p.email !== "string" || !p.email.includes("@")) return null;
  if (typeof p.exp !== "number" || !Number.isFinite(p.exp) || p.exp <= Date.now()) {
    return null;
  }
  return { email: p.email.trim().toLowerCase() };
}
