-- Per-game Gmail OAuth connections + game routing (hybrid with legacy admin_settings universal).
create table vbnym.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  gmail_refresh_token text,
  gmail_connected_email text,
  gmail_connected_at timestamptz,
  gmail_assumed_expires_at timestamptz,
  gmail_provider_refresh_expires_at timestamptz,
  gmail_reauth_reminder_sent_for_expires_at timestamptz,
  reauth_required boolean not null default false,
  last_successful_refresh_at timestamptz,
  created_at timestamptz not null default now()
);

create index gmail_connections_connected_email_idx on vbnym.gmail_connections (lower(gmail_connected_email));
create index gmail_connections_reauth_required_idx on vbnym.gmail_connections (reauth_required) where reauth_required = true;

create table vbnym.game_email_sync_config (
  game_id uuid primary key references vbnym.games(id) on delete cascade,
  preferred_gmail_connection_id uuid references vbnym.gmail_connections(id) on delete set null,
  use_universal_fallback boolean not null default true
);

create index game_email_sync_config_preferred_idx on vbnym.game_email_sync_config (preferred_gmail_connection_id);

alter table vbnym.gmail_connections enable row level security;
alter table vbnym.game_email_sync_config enable row level security;

create policy "vbnym_admin_all_gmail_connections"
  on vbnym.gmail_connections for all to authenticated
  using (true) with check (true);

create policy "vbnym_admin_all_game_email_sync_config"
  on vbnym.game_email_sync_config for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete on vbnym.gmail_connections to postgres, service_role, authenticated;
grant select, insert, update, delete on vbnym.game_email_sync_config to postgres, service_role, authenticated;

alter default privileges in schema vbnym grant select, insert, update, delete on tables to authenticated;

-- Universal inbox: track forced re-auth and last successful token refresh (refresh-first path).
alter table vbnym.admin_settings
  add column if not exists gmail_reauth_required boolean not null default false,
  add column if not exists gmail_last_successful_refresh_at timestamptz;
