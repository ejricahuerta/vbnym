import "server-only";

import { randomBytes } from "node:crypto";

import { google } from "googleapis";

/** httpOnly CSRF state for direct Google → Supabase id_token sign-in */
export const ADMIN_GOOGLE_SIGNIN_STATE_COOKIE = "vbnym_admin_gsi_state";
export const ADMIN_GOOGLE_SIGNIN_NEXT_COOKIE = "vbnym_admin_gsi_next";

const OAUTH_STATE_MAX_AGE_S = 600;

function getGoogleOAuthCredentials(): { clientId: string; clientSecret: string } {
  const clientId =
    process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET, or GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
    );
  }
  return { clientId, clientSecret };
}

function buildAdminSignInOAuthClient(redirectUri: string) {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Redirect URI registered in Google Cloud → Credentials → OAuth client → Authorized redirect URIs.
 * Defaults to this app’s admin sign-in callback on the given origin.
 */
export function getAdminGoogleSignInRedirectUri(origin: string): string {
  const fromEnv = process.env.GOOGLE_ADMIN_SIGNIN_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  const base = origin.replace(/\/$/, "");
  return `${base}/api/auth/google/admin/callback`;
}

export function adminGoogleSignInCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE_S,
  };
}

export function clearAdminGoogleSignInCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: 0;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export function prepareAdminGoogleSignInUrl(params: {
  publicOrigin: string;
  nextPath: string;
  loginHint: string;
}): { redirectUrl: string; state: string; nextPath: string } {
  const origin = params.publicOrigin.replace(/\/$/, "");
  const redirectUri = getAdminGoogleSignInRedirectUri(origin);
  const oauth = buildAdminSignInOAuthClient(redirectUri);
  const state = randomBytes(32).toString("hex");
  const hint = params.loginHint.trim().toLowerCase();
  const redirectUrl = oauth.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "https://www.googleapis.com/auth/userinfo.email"],
    state,
    prompt: "select_account",
    ...(hint.includes("@") ? { login_hint: hint } : {}),
  });
  return { redirectUrl, state, nextPath: params.nextPath };
}

export async function exchangeAdminGoogleSignInCode(params: {
  publicOrigin: string;
  code: string;
}): Promise<{ idToken: string } | { error: string }> {
  const origin = params.publicOrigin.replace(/\/$/, "");
  const redirectUri = getAdminGoogleSignInRedirectUri(origin);
  try {
    const oauth = buildAdminSignInOAuthClient(redirectUri);
    const { tokens } = await oauth.getToken(params.code);
    const idToken = tokens.id_token;
    if (!idToken) {
      return { error: "missing_id_token" };
    }
    return { idToken };
  } catch (e) {
    const message = e instanceof Error ? e.message : "token_exchange_failed";
    return { error: message };
  }
}
