/** Cookie set during OAuth redirect to distinguish admin vs host callback handling. */
export const GMAIL_OAUTH_FLOW_COOKIE = "gmail_oauth_flow";

export type GmailOAuthFlow = "admin" | "host";

/** Stable primary key for `gmail_connections` rows owned by a host session. */
export function hostGmailConnectionId(email: string): string {
  return `host:${email.trim().toLowerCase()}`;
}
