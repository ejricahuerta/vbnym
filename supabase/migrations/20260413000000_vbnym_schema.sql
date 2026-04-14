-- NYM Volleyball — application tables in schema vbnym
create schema if not exists vbnym;

grant usage on schema vbnym to postgres, anon, authenticated, service_role;

create table vbnym.games (
  id           uuid primary key default gen_random_uuid(),
  location     text not null,
  address      text,
  lat          double precision,
  lng          double precision,
  date         date not null,
  time         text not null,
  cap          integer not null check (cap >= 2),
  price        numeric(6,2) not null,
  etransfer    text not null,
  created_at   timestamptz default now()
);

-- payment_code nullable until /api/notify fills it (webhook or server signup path)
create table vbnym.signups (
  id                   uuid primary key default gen_random_uuid(),
  game_id              uuid not null references vbnym.games(id) on delete cascade,
  name                 text not null,
  email                text not null,
  paid                 boolean default false,
  friends              text[] default '{}',
  payment_code         text,
  payment_code_expires_at timestamptz,
  payment_verified_at  timestamptz,
  payment_email_id     text,
  created_at           timestamptz default now(),
  constraint signups_payment_code_key unique (payment_code)
);

create index signups_game_id_idx on vbnym.signups(game_id);
create index signups_payment_code_idx on vbnym.signups(payment_code);
create index signups_unpaid_idx on vbnym.signups(game_id) where paid = false;
create index signups_payment_code_expires_at_idx on vbnym.signups(payment_code_expires_at);

create table vbnym.admin_settings (
  id                    int primary key default 1,
  gmail_refresh_token   text,
  gmail_connected_email text,
  gmail_connected_at    timestamptz,
  last_synced_at        timestamptz,
  last_sync_matched     int default 0
);

insert into vbnym.admin_settings (id) values (1)
  on conflict (id) do nothing;

alter table vbnym.games enable row level security;
alter table vbnym.signups enable row level security;
alter table vbnym.admin_settings enable row level security;

create policy "vbnym_public_read_games"
  on vbnym.games for select to anon, authenticated
  using (true);

create policy "vbnym_admin_all_games"
  on vbnym.games for all to authenticated
  using (true) with check (true);

create policy "vbnym_public_read_signups"
  on vbnym.signups for select to anon, authenticated
  using (true);

create policy "vbnym_public_insert_signups"
  on vbnym.signups for insert to anon, authenticated
  with check (true);

create policy "vbnym_admin_update_signups"
  on vbnym.signups for update to authenticated
  using (true) with check (true);

create policy "vbnym_admin_delete_signups"
  on vbnym.signups for delete to authenticated
  using (true);

create policy "vbnym_admin_all_settings"
  on vbnym.admin_settings for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete on all tables in schema vbnym to postgres, service_role;
grant select on vbnym.games, vbnym.signups to anon;
grant insert on vbnym.signups to anon;
grant select, insert, update, delete on vbnym.games, vbnym.signups, vbnym.admin_settings to authenticated;

alter default privileges in schema vbnym grant select on tables to anon;
alter default privileges in schema vbnym grant select, insert, update, delete on tables to authenticated;
