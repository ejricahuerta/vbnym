-- 6ixBack schema → fresh init (empty database).

create schema if not exists "6ixback";

drop table if exists "6ixback".payment_events cascade;
drop table if exists "6ixback".game_email_sync_config cascade;
drop table if exists "6ixback".gmail_connections cascade;
drop table if exists "6ixback".signups cascade;
drop table if exists "6ixback".games cascade;

create table "6ixback".games (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('dropin', 'league', 'tournament')),
  title text not null,
  venue_name text not null,
  venue_area text,
  starts_at timestamptz not null,
  duration_minutes integer not null default 120,
  skill_level text not null default 'Intermediate',
  capacity integer not null default 18,
  signed_count integer not null default 0,
  waitlist_count integer not null default 0,
  price_cents integer not null default 1500,
  host_name text not null,
  host_email text not null,
  owner_email text not null,
  notes text,
  status text not null default 'live' check (status in ('draft', 'live', 'cancelled')),
  created_at timestamptz not null default now()
);

create table "6ixback".signups (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references "6ixback".games(id) on delete cascade,
  player_name text not null,
  player_email text not null,
  payment_code text not null unique,
  paid boolean not null default false,
  status text not null default 'active' check (status in ('active', 'waitlist', 'cancelled')),
  created_at timestamptz not null default now()
);

create table "6ixback".gmail_connections (
  id text primary key,
  connected_email text,
  access_token text,
  refresh_token text not null,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table "6ixback".game_email_sync_config (
  game_id uuid primary key references "6ixback".games(id) on delete cascade,
  preferred_gmail_connection_id text references "6ixback".gmail_connections(id) on delete set null,
  use_universal_fallback boolean not null default true
);

create table "6ixback".payment_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references "6ixback".games(id) on delete cascade,
  signup_id uuid references "6ixback".signups(id) on delete set null,
  payment_code text not null,
  source text not null default 'gmail',
  matched boolean not null default false,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index idx_games_starts_at on "6ixback".games(starts_at);
create index idx_games_status_starts_at on "6ixback".games(status, starts_at);
create index idx_signups_game_id_status on "6ixback".signups(game_id, status);
create index idx_signups_payment_code on "6ixback".signups(payment_code);
create index idx_payment_events_game_id on "6ixback".payment_events(game_id);

grant usage on schema "6ixback" to postgres, service_role;
grant all on all tables in schema "6ixback" to postgres, service_role;
grant all on all sequences in schema "6ixback" to postgres, service_role;
