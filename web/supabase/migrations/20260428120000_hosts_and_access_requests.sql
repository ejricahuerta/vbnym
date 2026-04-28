-- Approved host emails (magic link host sign-in only succeeds for these rows).
create table if not exists "6ixback".approved_hosts (
  email text primary key,
  created_at timestamptz not null default now()
);

create index if not exists idx_approved_hosts_created_at on "6ixback".approved_hosts(created_at desc);

-- Public requests from people who want to host (not on approved_hosts yet).
create table if not exists "6ixback".host_access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_host_access_requests_status_created
  on "6ixback".host_access_requests(status, created_at desc);

grant select, insert, update, delete on "6ixback".approved_hosts to postgres, service_role;
grant select, insert, update, delete on "6ixback".host_access_requests to postgres, service_role;
