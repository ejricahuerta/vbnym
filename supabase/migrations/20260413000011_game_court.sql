-- Optional court number or letter for the run (e.g. 3, A, B1).
alter table vbnym.games
  add column if not exists court text;

comment on column vbnym.games.court is 'Optional court number or letter shown to players (e.g. 3, A).';
