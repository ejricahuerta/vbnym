-- Optional listing controls (screen-4 style: private / opens later)
alter table vbnym.games
  add column if not exists listed boolean not null default true,
  add column if not exists registration_opens_at timestamptz;

comment on column vbnym.games.listed is 'When false, game is hidden from public list (invite-only placeholder).';
comment on column vbnym.games.registration_opens_at is 'When set and in the future, show coming-soon / notify UI instead of join.';

-- Extended signup (screen.png style form)
alter table vbnym.signups
  add column if not exists phone text,
  add column if not exists skill_level text,
  add column if not exists waiver_accepted boolean not null default false;
