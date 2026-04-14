"use client";

import { MY_GAMES_COOKIE, parseMyGamesCookieValue } from "@/lib/saved-games-cookie";

const CONSENT_COOKIE = "nym_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const hit = document.cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(prefix));
  return hit ? decodeURIComponent(hit.slice(prefix.length)) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export function getCookieConsent(): "granted" | "denied" | "unset" {
  const v = readCookie(CONSENT_COOKIE);
  if (v === "granted" || v === "denied") return v;
  return "unset";
}

export function setCookieConsent(value: "granted" | "denied") {
  writeCookie(CONSENT_COOKIE, value, ONE_YEAR_SECONDS);
}

export function getSavedGameIds(): string[] {
  return parseMyGamesCookieValue(readCookie(MY_GAMES_COOKIE));
}

export function saveGameId(gameId: string) {
  const ids = getSavedGameIds();
  if (ids.includes(gameId)) return;
  const next = [...ids, gameId].slice(-30);
  writeCookie(MY_GAMES_COOKIE, next.join(","), ONE_YEAR_SECONDS);
}

const LS_NAME = "nym_last_player_name";
const LS_EMAIL = "nym_last_player_email";

/** Clear saved game ids cookie and optional name/email hints from this browser. */
export function clearPlayerBrowserData() {
  writeCookie(MY_GAMES_COOKIE, "", 0);
  try {
    localStorage.removeItem(LS_NAME);
    localStorage.removeItem(LS_EMAIL);
  } catch {
    /* ignore */
  }
}
