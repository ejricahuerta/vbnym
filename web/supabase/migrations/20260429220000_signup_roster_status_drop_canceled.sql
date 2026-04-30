-- Roster status: single off-roster state `removed` (replaces `canceled`).

update "6ixback".signups
set status = 'removed'
where status = 'canceled';

alter table "6ixback".signups
  drop constraint if exists signups_status_check;

alter table "6ixback".signups
  add constraint signups_status_check
  check (status in ('active', 'waitlist', 'removed', 'deleted'));
