"use client";

import {
  MY_GAMES_COOKIE,
  MY_GAMES_COOKIE_MAX_AGE_SEC,
  parseMyGamesCookieValue,
} from "@/lib/saved-games-cookie";

const CONSENT_COOKIE = "nym_cookie_consent";

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
  writeCookie(CONSENT_COOKIE, value, MY_GAMES_COOKIE_MAX_AGE_SEC);
}

export function getSavedGameIds(): string[] {
  return parseMyGamesCookieValue(readCookie(MY_GAMES_COOKIE));
}

export function saveGameId(gameId: string) {
  const ids = getSavedGameIds();
  if (ids.includes(gameId)) return;
  const next = [...ids, gameId].slice(-30);
  writeCookie(MY_GAMES_COOKIE, next.join(","), MY_GAMES_COOKIE_MAX_AGE_SEC);
}

/** Per-game localStorage keys (prefill name/email only when returning to the same game). */
export function playerNameStorageKey(gameId: string): string {
  return `nym_player_name_${gameId}`;
}

export function playerEmailStorageKey(gameId: string): string {
  return `nym_player_email_${gameId}`;
}

const LEGACY_LS_NAME = "nym_last_player_name";
const LEGACY_LS_EMAIL = "nym_last_player_email";

const PER_GAME_NAME_PREFIX = "nym_player_name_";
const PER_GAME_EMAIL_PREFIX = "nym_player_email_";

/** Clear saved game ids cookie and optional name/email hints from this browser. */
export function clearPlayerBrowserData() {
  writeCookie(MY_GAMES_COOKIE, "", 0);
  try {
    localStorage.removeItem(LEGACY_LS_NAME);
    localStorage.removeItem(LEGACY_LS_EMAIL);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith(PER_GAME_NAME_PREFIX) ||
        key.startsWith(PER_GAME_EMAIL_PREFIX)
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
