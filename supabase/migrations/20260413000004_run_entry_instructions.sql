-- Optional venue / door / parking notes for players
alter table vbnym.games
  add column if not exists entry_instructions text;

comment on column vbnym.games.entry_instructions is 'Optional: how to enter the venue (door code, court number, parking, etc.).';
