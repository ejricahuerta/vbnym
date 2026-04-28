/** HttpOnly session cookie after the player opens the league portal magic link. */
export const LEAGUE_PORTAL_SESSION_COOKIE = "nym_league_portal_session";

/** Magic link in email validity (single open). */
export const LEAGUE_PORTAL_MAGIC_LINK_TTL_MS = 60 * 60 * 1000;

/** Signed session cookie lifetime after opening the link. */
export const LEAGUE_PORTAL_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;
