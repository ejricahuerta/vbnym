-- Reusable venues for games (name, address, map pin).
create table if not exists vbnym.venues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  lat        double precision,
  lng        double precision,
  created_at timestamptz not null default now()
);

create index if not exists venues_created_at_idx on vbnym.venues (created_at desc);

alter table vbnym.games
  add column if not exists venue_id uuid references vbnym.venues (id) on delete set null;

create index if not exists games_venue_id_idx on vbnym.games (venue_id);

comment on table vbnym.venues is 'Saved gym / court locations; games can reference one to pre-fill location fields.';
comment on column vbnym.games.venue_id is 'Optional link to a saved venue template; run still stores its own location/address snapshot.';

alter table vbnym.venues enable row level security;

drop policy if exists "vbnym_public_read_venues" on vbnym.venues;
create policy "vbnym_public_read_venues"
  on vbnym.venues for select to anon, authenticated
  using (true);

drop policy if exists "vbnym_admin_all_venues" on vbnym.venues;
create policy "vbnym_admin_all_venues"
  on vbnym.venues for all to authenticated
  using (true) with check (true);

grant select on vbnym.venues to anon;
grant select, insert, update, delete on vbnym.venues to postgres, service_role, authenticated;
