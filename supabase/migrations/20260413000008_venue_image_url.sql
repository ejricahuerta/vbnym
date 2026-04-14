-- Hero / card image for venues (often from Google Places when address is picked).
alter table vbnym.venues
  add column if not exists image_url text;

comment on column vbnym.venues.image_url is 'Optional photo URL (e.g. Google Places photo); shown on public home when games link to this venue.';
