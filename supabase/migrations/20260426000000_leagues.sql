-- Leagues: seasons, teams, invites, waivers, permits, fixtures (linked to games), member payments.

-- ---------------------------------------------------------------------------
-- Core league / season
-- ---------------------------------------------------------------------------
create table if not exists vbnym.leagues (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists vbnym.league_seasons (
  id                      uuid primary key default gen_random_uuid(),
  league_id               uuid not null references vbnym.leagues (id) on delete cascade,
  slug                    text not null,
  name                    text not null,
  description             text,
  listed                  boolean not null default true,
  etransfer_instructions  text not null default '',
  registration_opens_at   timestamptz,
  registration_closes_at  timestamptz,
  created_at              timestamptz not null default now(),
  unique (league_id, slug)
);

create index if not exists league_seasons_league_id_idx on vbnym.league_seasons (league_id);

-- ---------------------------------------------------------------------------
-- Waiver versions (per season; immutable rows for audit)
-- ---------------------------------------------------------------------------
create table if not exists vbnym.league_waiver_versions (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references vbnym.league_seasons (id) on delete cascade,
  version_label  text not null,
  body_text      text not null,
  created_at     timestamptz not null default now()
);

create index if not exists league_waiver_versions_season_id_idx
  on vbnym.league_waiver_versions (season_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Facility permits (Toronto City / school board / private -> metadata only)
-- ---------------------------------------------------------------------------
create table if not exists vbnym.facility_permits (
  id               uuid primary key default gen_random_uuid(),
  season_id        uuid not null references vbnym.league_seasons (id) on delete cascade,
  issuer_type      text not null check (issuer_type in ('city', 'school_board', 'private_facility')),
  reference_number text,
  status           text not null default 'draft' check (status in ('draft', 'active', 'expired', 'cancelled')),
  valid_from       date,
  valid_to         date,
  notes            text,
  document_url     text,
  created_at       timestamptz not null default now()
);

create index if not exists facility_permits_season_id_idx on vbnym.facility_permits (season_id);

-- ---------------------------------------------------------------------------
-- Divisions & teams
-- ---------------------------------------------------------------------------
create table if not exists vbnym.league_divisions (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid not null references vbnym.league_seasons (id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists league_divisions_season_id_idx on vbnym.league_divisions (season_id);

create table if not exists vbnym.league_teams (
  id              uuid primary key default gen_random_uuid(),
  division_id     uuid not null references vbnym.league_divisions (id) on delete restrict,
  name            text not null,
  captain_email   text not null,
  captain_name    text not null,
  status          text not null default 'active' check (status in ('pending', 'active', 'withdrawn')),
  created_at      timestamptz not null default now()
);

create index if not exists league_teams_division_id_idx on vbnym.league_teams (division_id);
create index if not exists league_teams_captain_email_idx on vbnym.league_teams (lower(captain_email));

-- ---------------------------------------------------------------------------
-- Roster members & invites
-- ---------------------------------------------------------------------------
create table if not exists vbnym.league_team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references vbnym.league_teams (id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null default 'member' check (role in ('captain', 'member')),
  created_at timestamptz not null default now()
);

create unique index if not exists league_team_members_team_lower_email_uniq
  on vbnym.league_team_members (team_id, (lower(email)));

create index if not exists league_team_members_team_id_idx on vbnym.league_team_members (team_id);
create index if not exists league_team_members_email_idx on vbnym.league_team_members (lower(email));

create table if not exists vbnym.league_member_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references vbnym.league_teams (id) on delete cascade,
  email       text not null,
  token       uuid not null default gen_random_uuid() unique,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at  timestamptz not null default (now() + interval '14 days'),
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists league_member_invites_token_idx on vbnym.league_member_invites (token);
create index if not exists league_member_invites_team_email_idx on vbnym.league_member_invites (team_id, (lower(email)));

create unique index if not exists league_member_invites_one_pending_per_email
  on vbnym.league_member_invites (team_id, (lower(email)))
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- Waiver acceptances & payments
-- ---------------------------------------------------------------------------
create table if not exists vbnym.league_member_waiver_acceptances (
  id                 uuid primary key default gen_random_uuid(),
  member_id          uuid not null references vbnym.league_team_members (id) on delete cascade,
  waiver_version_id  uuid not null references vbnym.league_waiver_versions (id) on delete restrict,
  invite_id          uuid references vbnym.league_member_invites (id) on delete set null,
  accepted_at        timestamptz not null default now(),
  unique (member_id, waiver_version_id)
);

create index if not exists league_member_waiver_member_idx on vbnym.league_member_waiver_acceptances (member_id);

create table if not exists vbnym.league_member_payments (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references vbnym.league_team_members (id) on delete cascade,
  reference_code  text not null unique,
  status          text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  amount          numeric(8, 2),
  etransfer_to    text,
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists league_member_payments_member_idx on vbnym.league_member_payments (member_id);
create index if not exists league_member_payments_status_idx on vbnym.league_member_payments (status);

-- ---------------------------------------------------------------------------
-- Fixtures: link season teams to scheduled games
-- ---------------------------------------------------------------------------
create table if not exists vbnym.league_fixtures (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references vbnym.league_seasons (id) on delete cascade,
  division_id    uuid references vbnym.league_divisions (id) on delete set null,
  home_team_id   uuid references vbnym.league_teams (id) on delete set null,
  away_team_id   uuid references vbnym.league_teams (id) on delete set null,
  game_id        uuid not null unique references vbnym.games (id) on delete cascade,
  round_number   int,
  matchday       int,
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists league_fixtures_season_id_idx on vbnym.league_fixtures (season_id);
create index if not exists league_fixtures_home_team_idx on vbnym.league_fixtures (home_team_id);
create index if not exists league_fixtures_away_team_idx on vbnym.league_fixtures (away_team_id);

-- ---------------------------------------------------------------------------
-- RLS: public read for marketing; sensitive tables -> no anon access
-- ---------------------------------------------------------------------------
alter table vbnym.leagues enable row level security;
alter table vbnym.league_seasons enable row level security;
alter table vbnym.league_divisions enable row level security;
alter table vbnym.league_waiver_versions enable row level security;
alter table vbnym.facility_permits enable row level security;
alter table vbnym.league_teams enable row level security;
alter table vbnym.league_team_members enable row level security;
alter table vbnym.league_member_invites enable row level security;
alter table vbnym.league_member_waiver_acceptances enable row level security;
alter table vbnym.league_member_payments enable row level security;
alter table vbnym.league_fixtures enable row level security;

drop policy if exists "vbnym_public_read_leagues" on vbnym.leagues;
create policy "vbnym_public_read_leagues"
  on vbnym.leagues for select to anon, authenticated using (true);

drop policy if exists "vbnym_admin_all_leagues" on vbnym.leagues;
create policy "vbnym_admin_all_leagues"
  on vbnym.leagues for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_public_read_league_seasons" on vbnym.league_seasons;
create policy "vbnym_public_read_league_seasons"
  on vbnym.league_seasons for select to anon, authenticated
  using (coalesce(listed, true));

drop policy if exists "vbnym_admin_all_league_seasons" on vbnym.league_seasons;
create policy "vbnym_admin_all_league_seasons"
  on vbnym.league_seasons for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_public_read_league_divisions" on vbnym.league_divisions;
create policy "vbnym_public_read_league_divisions"
  on vbnym.league_divisions for select to anon, authenticated using (true);

drop policy if exists "vbnym_admin_all_league_divisions" on vbnym.league_divisions;
create policy "vbnym_admin_all_league_divisions"
  on vbnym.league_divisions for all to authenticated using (true) with check (true);

-- Waiver text may be shown on accept page -> allow read for listed seasons only
drop policy if exists "vbnym_public_read_league_waivers" on vbnym.league_waiver_versions;
create policy "vbnym_public_read_league_waivers"
  on vbnym.league_waiver_versions for select to anon, authenticated
  using (
    exists (
      select 1 from vbnym.league_seasons s
      where s.id = season_id and coalesce(s.listed, true)
    )
  );

drop policy if exists "vbnym_admin_all_league_waivers" on vbnym.league_waiver_versions;
create policy "vbnym_admin_all_league_waivers"
  on vbnym.league_waiver_versions for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_admin_all_facility_permits" on vbnym.facility_permits;
create policy "vbnym_admin_all_facility_permits"
  on vbnym.facility_permits for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_admin_all_league_teams" on vbnym.league_teams;
create policy "vbnym_admin_all_league_teams"
  on vbnym.league_teams for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_admin_all_league_team_members" on vbnym.league_team_members;
create policy "vbnym_admin_all_league_team_members"
  on vbnym.league_team_members for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_admin_all_league_member_invites" on vbnym.league_member_invites;
create policy "vbnym_admin_all_league_member_invites"
  on vbnym.league_member_invites for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_admin_all_league_waiver_acceptances" on vbnym.league_member_waiver_acceptances;
create policy "vbnym_admin_all_league_waiver_acceptances"
  on vbnym.league_member_waiver_acceptances for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_admin_all_league_member_payments" on vbnym.league_member_payments;
create policy "vbnym_admin_all_league_member_payments"
  on vbnym.league_member_payments for all to authenticated using (true) with check (true);

drop policy if exists "vbnym_admin_all_league_fixtures" on vbnym.league_fixtures;
create policy "vbnym_admin_all_league_fixtures"
  on vbnym.league_fixtures for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Grants (mirror venues pattern)
-- ---------------------------------------------------------------------------
grant select on vbnym.leagues, vbnym.league_seasons, vbnym.league_divisions, vbnym.league_waiver_versions
  to anon;

grant select, insert, update, delete on vbnym.leagues, vbnym.league_seasons, vbnym.league_divisions,
  vbnym.league_waiver_versions, vbnym.facility_permits, vbnym.league_teams, vbnym.league_team_members,
  vbnym.league_member_invites, vbnym.league_member_waiver_acceptances, vbnym.league_member_payments,
  vbnym.league_fixtures
  to postgres, service_role, authenticated;

comment on table vbnym.leagues is 'Top-level league branding and public slug.';
comment on table vbnym.league_seasons is 'A schedulable season under a league; links to waivers and permits.';
comment on table vbnym.league_fixtures is 'League match rows pointing at vbnym.games for schedule/court details.';
