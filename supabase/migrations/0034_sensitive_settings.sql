-- mark_sensitive: new posts start with Sensitive content ticked.
-- show_sensitive: this account sees flagged photos without the blur.
alter table public.profiles
  add column mark_sensitive boolean not null default false,
  add column show_sensitive boolean not null default false;
