-- Host roster: PAID / SENT / OWES tri-state (replaces boolean paid).

alter table "6ixback".signups add column payment_status text;

update "6ixback".signups
set payment_status = case when paid then 'paid' else 'owes' end;

alter table "6ixback".signups alter column payment_status set default 'owes';
alter table "6ixback".signups alter column payment_status set not null;

alter table "6ixback".signups
  add constraint signups_payment_status_check check (payment_status in ('paid', 'sent', 'owes'));

alter table "6ixback".signups drop column paid;
