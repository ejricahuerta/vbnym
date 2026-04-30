-- Group signup support: track who submitted and who gets refunded.

alter table "6ixback".signups
  add column if not exists signup_group_id uuid;

update "6ixback".signups
set signup_group_id = id
where signup_group_id is null;

alter table "6ixback".signups
  alter column signup_group_id set not null;

alter table "6ixback".signups
  add column if not exists added_by_name text;

update "6ixback".signups
set added_by_name = player_name
where added_by_name is null;

alter table "6ixback".signups
  alter column added_by_name set not null;

alter table "6ixback".signups
  add column if not exists added_by_email text;

update "6ixback".signups
set added_by_email = player_email
where added_by_email is null;

alter table "6ixback".signups
  alter column added_by_email set not null;

alter table "6ixback".signups
  add column if not exists refund_owner_name text;

update "6ixback".signups
set refund_owner_name = player_name
where refund_owner_name is null;

alter table "6ixback".signups
  alter column refund_owner_name set not null;

alter table "6ixback".signups
  add column if not exists refund_owner_email text;

update "6ixback".signups
set refund_owner_email = player_email
where refund_owner_email is null;

alter table "6ixback".signups
  alter column refund_owner_email set not null;

alter table "6ixback".signups
  add column if not exists is_primary_signup boolean not null default false;

update "6ixback".signups
set is_primary_signup = true
where is_primary_signup = false
  and lower(trim(player_email)) = lower(trim(added_by_email));

create index if not exists idx_signups_game_signup_group
  on "6ixback".signups(game_id, signup_group_id);

create index if not exists idx_signups_refund_owner_email
  on "6ixback".signups(lower(trim(refund_owner_email)));
