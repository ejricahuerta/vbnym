-- Community inbox: bugs, ideas, sponsors, hosts, ads (submitted via web server action + service role).
create table if not exists vbnym.community_submissions (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('bug', 'feature', 'sponsor', 'host_game', 'ads')),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_submissions_created_idx
  on vbnym.community_submissions (created_at desc);

create index if not exists community_submissions_category_idx
  on vbnym.community_submissions (category);

alter table vbnym.community_submissions enable row level security;

drop policy if exists "vbnym_admin_all_community_submissions" on vbnym.community_submissions;
create policy "vbnym_admin_all_community_submissions"
  on vbnym.community_submissions for all to authenticated
  using (true) with check (true);

grant select, insert, update, delete on vbnym.community_submissions to postgres, service_role, authenticated;
