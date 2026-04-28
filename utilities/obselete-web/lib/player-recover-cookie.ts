/** HttpOnly session cookie set after the player clicks the magic link in email. */
export const PLAYER_RECOVER_SESSION_COOKIE = "nym_player_recover_session";

/** Magic link in email is valid for this long (single use: open link once). */
export const PLAYER_MAGIC_LINK_TTL_MS = 60 * 60 * 1000;

/** After opening the link, the signed session cookie lasts this many seconds. */
export const PLAYER_RECOVER_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;
