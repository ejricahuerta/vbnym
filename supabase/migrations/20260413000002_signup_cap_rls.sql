-- Enforce cap on anonymous signups at the database layer (prevents direct REST bypass)
create or replace function vbnym.signups_booked_count(p_game_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(
    sum(1 + coalesce(cardinality(friends), 0)),
    0
  )::int
  from vbnym.signups
  where game_id = p_game_id;
$$;

drop policy if exists "vbnym_public_insert_signups" on vbnym.signups;

create policy "vbnym_public_insert_signups"
  on vbnym.signups for insert to anon, authenticated
  with check (
    exists (
      select 1 from vbnym.games g
      where g.id = game_id
        and g.cap >= vbnym.signups_booked_count(game_id) + 1 + coalesce(cardinality(friends), 0)
    )
  );
