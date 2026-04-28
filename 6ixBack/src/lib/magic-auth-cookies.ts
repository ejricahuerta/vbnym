/** Magic link delivered by email remains valid for this duration. */
export const MAGIC_LINK_TTL_MS = 60 * 60 * 1000;

/** HttpOnly session cookie lifetime after opening the magic link (seconds). */
export const MAGIC_HOST_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export const MAGIC_PLAYER_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export const MAGIC_ADMIN_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export const HOST_SESSION_COOKIE = "sixback_host_session";

export const PLAYER_SESSION_COOKIE = "sixback_player_session";
