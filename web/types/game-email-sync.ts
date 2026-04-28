export type GameEmailSyncAdminView = {
  use_universal_fallback: boolean;
  preferred_gmail_connection_id: string | null;
  connected_email: string | null;
  reauth_required: boolean;
  gmail_assumed_expires_at: string | null;
};
