-- Optional end time for games; public UI shows a range (e.g. 7–10 PM).
alter table vbnym.games
  add column if not exists end_time text;

comment on column vbnym.games.end_time is 'End of play window (HH:mm or legacy display string); shown with time as a range when set.';
