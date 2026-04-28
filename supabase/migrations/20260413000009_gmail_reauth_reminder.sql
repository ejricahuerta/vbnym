-- Track when we treat the Gmail refresh grant as needing renewal (Google testing tokens ~7d;
-- production often long-lived -> tune with GMAIL_OAUTH_REFRESH_VALID_DAYS on the app side).
alter table vbnym.admin_settings
  add column if not exists gmail_assumed_expires_at timestamptz,
  add column if not exists gmail_reauth_reminder_sent_for_expires_at timestamptz;
