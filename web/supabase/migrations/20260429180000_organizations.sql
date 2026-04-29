-- Canonical organizations (admin-managed). Seeded default for 6ixBack.

create table if not exists "6ixback".organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists organizations_name_lower
  on "6ixback".organizations (lower(trim(name)));

insert into "6ixback".organizations (id, name)
select '00000000-0000-4000-8000-000000000001'::uuid, '6ixBack'
where not exists (
  select 1 from "6ixback".organizations o where o.id = '00000000-0000-4000-8000-000000000001'::uuid
);

alter table "6ixback".games
  add column if not exists organization_id uuid references "6ixback".organizations(id) on delete restrict;

update "6ixback".games
set organization_id = '00000000-0000-4000-8000-000000000001'::uuid
where organization_id is null;

alter table "6ixback".games
  alter column organization_id set not null;

create index if not exists idx_games_organization_id on "6ixback".games(organization_id);

alter table "6ixback".signups
  add column if not exists organization_id uuid references "6ixback".organizations(id) on delete restrict;

update "6ixback".signups
set organization_id = '00000000-0000-4000-8000-000000000001'::uuid
where organization_id is null;

alter table "6ixback".signups
  alter column organization_id set not null;

create index if not exists idx_signups_organization_id on "6ixback".signups(organization_id);

alter table "6ixback".host_access_requests
  add column if not exists organization_id uuid references "6ixback".organizations(id) on delete restrict;

alter table "6ixback".host_access_requests
  add column if not exists context_game_id uuid references "6ixback".games(id) on delete set null;

update "6ixback".host_access_requests
set organization_id = '00000000-0000-4000-8000-000000000001'::uuid
where organization_id is null;

alter table "6ixback".host_access_requests
  alter column organization_id set not null;

create index if not exists idx_host_access_requests_organization_id
  on "6ixback".host_access_requests(organization_id);

create index if not exists idx_host_access_requests_context_game_id
  on "6ixback".host_access_requests(context_game_id);

grant select, insert, update, delete on "6ixback".organizations to postgres, service_role;
