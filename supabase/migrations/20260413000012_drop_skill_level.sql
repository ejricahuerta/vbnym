alter table vbnym.signups drop column if exists skill_level;

-- waitlist_signups is created in a later migration; skip if that table was never applied.
do $$
begin
  if to_regclass('vbnym.waitlist_signups') is not null then
    execute 'alter table vbnym.waitlist_signups drop column if exists skill_level';
  end if;
end $$;
