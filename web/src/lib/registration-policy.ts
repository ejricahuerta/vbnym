/** Wall clock for interpreting scheduled game times in policy copy. */
export const GAME_SCHEDULE_TIMEZONE = "America/Toronto";

export const GAME_SCHEDULE_TIMEZONE_LABEL = "Toronto (Eastern Time)";

/** Payment code validity for new signups and for waitlist invite holds. */
export const PAYMENT_CODE_EXPIRY_MINUTES = 30;

/** Waitlist invite: time to complete payment for a released spot (same window as payment code). */
export const WAITLIST_INVITE_MINUTES = PAYMENT_CODE_EXPIRY_MINUTES;

/** Max roster player slots that can sit on the waitlist for one game (total across all waitlisted signups). */
export const MAX_WAITLIST_PLAYER_SLOTS = 6;

/** Minimum lead time before scheduled start to cancel under policy. */
export const CANCELLATION_MIN_HOURS_BEFORE_GAME = 2;
