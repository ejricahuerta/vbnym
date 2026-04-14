-- Atomic signup: lock game row, delete expired unpaid holds, cap check + insert in one transaction.
-- Prevents concurrent serverless invocations from overbooking past cap.

create or replace function vbnym.signup_for_game(
  p_id uuid,
  p_game_id uuid,
  p_name text,
  p_email text,
  p_friends text[],
  p_phone text,
  p_waiver_accepted boolean,
  p_payment_code text,
  p_payment_code_expires_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = vbnym, public
as $$
declare
  v_cap integer;
  v_booked integer;
  v_new_heads integer;
  v_friends text[] := coalesce(p_friends, '{}');
begin
  select g.cap into v_cap
  from vbnym.games g
  where g.id = p_game_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'game_not_found');
  end if;

  delete from vbnym.signups s
  where s.game_id = p_game_id
    and s.paid = false
    and s.payment_code_expires_at is not null
    and s.payment_code_expires_at <= now();

  select coalesce(
    sum(1 + coalesce(cardinality(s.friends), 0)),
    0
  )::int into v_booked
  from vbnym.signups s
  where s.game_id = p_game_id
    and (
      s.paid = true
      or s.payment_code_expires_at is null
      or s.payment_code_expires_at > now()
    );

  v_new_heads := 1 + coalesce(cardinality(v_friends), 0);

  if v_booked + v_new_heads > v_cap then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;

  insert into vbnym.signups (
    id,
    game_id,
    name,
    email,
    friends,
    paid,
    payment_code,
    payment_code_expires_at,
    phone,
    waiver_accepted
  ) values (
    p_id,
    p_game_id,
    p_name,
    p_email,
    v_friends,
    false,
    p_payment_code,
    p_payment_code_expires_at,
    nullif(trim(coalesce(p_phone, '')), ''),
    coalesce(p_waiver_accepted, false)
  );

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'duplicate_payment_code');
  when others then
    return jsonb_build_object('ok', false, 'reason', 'error', 'detail', sqlerrm);
end;
$$;

comment on function vbnym.signup_for_game(uuid, uuid, text, text, text[], text, boolean, text, timestamptz) is
  'Serialized signup: FOR UPDATE on games, cleanup expired unpaid, enforce cap, insert signup. Called from server (service role).';

revoke all on function vbnym.signup_for_game(uuid, uuid, text, text, text[], text, boolean, text, timestamptz) from public;

grant execute on function vbnym.signup_for_game(uuid, uuid, text, text, text[], text, boolean, text, timestamptz) to service_role;
