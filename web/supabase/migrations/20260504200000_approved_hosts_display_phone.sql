alter table "6ixback".approved_hosts
  add column if not exists display_name text,
  add column if not exists phone_e164 text;

comment on column "6ixback".approved_hosts.display_name is 'Host display name for admin reference; optional.';
comment on column "6ixback".approved_hosts.phone_e164 is 'Optional E.164 digits only (no +), for admin contact.';
