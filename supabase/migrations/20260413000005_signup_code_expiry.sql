-- Expiry window for payment-code signups (auto-release unpaid holds)
alter table vbnym.signups
  add column if not exists payment_code_expires_at timestamptz;

create index if not exists signups_payment_code_expires_at_idx
  on vbnym.signups(payment_code_expires_at);

comment on column vbnym.signups.payment_code_expires_at is
  'When set and unpaid, signup is considered expired after this timestamp.';

-- Backfill existing unpaid signups with a default 15-minute expiry from created_at.
update vbnym.signups
set payment_code_expires_at = created_at + interval '15 minutes'
where paid = false
  and payment_code_expires_at is null
  and created_at is not null;

-- Count only active signups toward game cap.
drop function if exists vbnym.signups_booked_count(uuid);

create function vbnym.signups_booked_count(p_game_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(
    sum(1 + coalesce(cardinality(friends), 0)),
    0
  )::int
  from vbnym.signups
  where game_id = p_game_id
    and (
      paid = true
      or payment_code_expires_at is null
      or payment_code_expires_at > now()
    );
$$;
