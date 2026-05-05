import { cookies } from "next/headers";

import { isAdminEmail } from "@/lib/admin-emails";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-constants";
import {
  HOST_SESSION_COOKIE,
  PLAYER_SESSION_COOKIE,
} from "@/lib/magic-auth-cookies";
import {
  verifyAdminSessionToken,
  verifyHostSessionToken,
  verifyPlayerSessionToken,
} from "@/lib/magic-link";

export async function isAdminAuthorized(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_SESSION_COOKIE)?.value;
  const v = verifyAdminSessionToken(raw);
  if (!v) return false;
  return isAdminEmail(v.email);
}

export type HostedGameManagementAuth =
  | { ok: true; hostSessionEmail: string | null; isAdmin: boolean }
  | { ok: false; error: string };

/** Host magic link and/or admin session may mutate live hosted games (details, roster, payouts). */
export async function resolveHostedGameManagement(): Promise<HostedGameManagementAuth> {
  const [hostSessionEmail, isAdmin] = await Promise.all([getHostSessionEmail(), isAdminAuthorized()]);
  if (!hostSessionEmail && !isAdmin) {
    return { ok: false, error: "Sign in as a host or admin to continue." };
  }
  return { ok: true, hostSessionEmail, isAdmin };
}

export async function getAdminSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(ADMIN_SESSION_COOKIE)?.value;
  const v = verifyAdminSessionToken(raw);
  if (!v || !isAdminEmail(v.email)) return null;
  return v.email;
}

export async function getHostSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(HOST_SESSION_COOKIE)?.value;
  const verified = verifyHostSessionToken(raw);
  return verified?.email ?? null;
}

export async function getPlayerSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(PLAYER_SESSION_COOKIE)?.value;
  const verified = verifyPlayerSessionToken(raw);
  return verified?.email ?? null;
}
