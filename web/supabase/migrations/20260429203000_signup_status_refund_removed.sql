-- Expand signup status model:
-- - payment_status: pending | paid | refund | canceled
-- - status: active | waitlist | canceled | removed | deleted
-- Legacy values are normalized for forward compatibility.

update "6ixback".signups
set payment_status = 'pending'
where payment_status = 'owes';

alter table "6ixback".signups
  drop constraint if exists signups_payment_status_check;

alter table "6ixback".signups
  add constraint signups_payment_status_check
  check (payment_status in ('pending', 'paid', 'refund', 'canceled'));

alter table "6ixback".signups
  drop constraint if exists signups_status_check;

update "6ixback".signups
set status = 'canceled'
where status = 'cancelled';

alter table "6ixback".signups
  add constraint signups_status_check
  check (status in ('active', 'waitlist', 'canceled', 'removed', 'deleted'));
