-- Rename legacy `sent` payment status to `pending`.
-- Keep `paid` and `owes`; tighten status check constraint.

update "6ixback".signups
set payment_status = 'pending'
where payment_status = 'sent';

alter table "6ixback".signups
  drop constraint if exists signups_payment_status_check;

alter table "6ixback".signups
  add constraint signups_payment_status_check
  check (payment_status in ('paid', 'pending', 'owes'));
