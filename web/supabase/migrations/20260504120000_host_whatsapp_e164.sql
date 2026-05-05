alter table "6ixback".games
  add column if not exists host_whatsapp_e164 text;

comment on column "6ixback".games.host_whatsapp_e164 is
  'Optional E.164 digits only (no +), e.g. 14165551234. Used for wa.me player Message link on game detail.';
