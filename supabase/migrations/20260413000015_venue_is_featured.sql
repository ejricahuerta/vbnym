-- Single venue can be highlighted on the public home; cleared for others when one is set.
alter table vbnym.venues
  add column if not exists is_featured boolean not null default false;

comment on column vbnym.venues.is_featured is 'When true, shown as the main venue on the public home; only one should be true (enforced in admin save).';
