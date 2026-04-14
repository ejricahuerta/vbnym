-- Ensures waitlist_signups exists (fixes "Could not find the table 'vbnym.waitlist_signups' in the schema cache"
-- when migration 20260413000006 was never applied or PostgREST cache is stale).
-- Current shape matches post-00012 (no skill_level).

create table if not exists vbnym.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references vbnym.games(id) on delete cascade,
  signup_id uuid references vbnym.signups(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  friends text[] not null default '{}',
  waiver_accepted boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'invited', 'joined', 'expired', 'removed')),
  full_reason text,
  notified_full_at timestamptz,
  invited_at timestamptz,
  invitation_expires_at timestamptz,
  notified_invited_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_signups_game_created_idx
  on vbnym.waitlist_signups(game_id, created_at);

create index if not exists waitlist_signups_game_status_idx
  on vbnym.waitlist_signups(game_id, status);

create index if not exists waitlist_signups_game_email_idx
  on vbnym.waitlist_signups(game_id, email);

alter table vbnym.waitlist_signups enable row level security;

drop policy if exists "vbnym_admin_all_waitlist_signups" on vbnym.waitlist_signups;
create policy "vbnym_admin_all_waitlist_signups"
  on vbnym.waitlist_signups for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete on vbnym.waitlist_signups to postgres, service_role, authenticated;

-- Drop legacy column if an older 00006-only database still has it.
alter table vbnym.waitlist_signups drop column if exists skill_level;

notify pgrst, 'reload schema';
