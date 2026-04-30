/** Stable primary key for `gmail_connections` rows owned by a host session. */
export function hostGmailConnectionId(email: string): string {
  return `host:${email.trim().toLowerCase()}`;
}
