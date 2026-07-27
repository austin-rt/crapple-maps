-- Crapple Maps — initial schema + RLS
-- Postgres (Supabase). See PLANNING.md for design rationale.
-- Conventions: uuid PKs, created_at on every table, FKs named *_id.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "postgis";      -- geography/geometry for maps + proximity
create extension if not exists "pg_trgm";       -- fuzzy tag/username matching
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ============================================================
-- Enums
-- ============================================================
create type access_type    as enum ('public', 'customers_only', 'code', 'ask_staff');
create type restroom_status as enum ('open', 'closed', 'gone');
create type restroom_source as enum ('user', 'osm', 'refuge');
create type log_visibility  as enum ('friends', 'private');
create type follow_status   as enum ('pending', 'approved');
create type vote_target     as enum ('code', 'review');
create type report_target   as enum ('log', 'review', 'photo', 'comment', 'user', 'code');
create type report_status   as enum ('pending', 'actioned', 'dismissed');
create type photo_owner      as enum ('review', 'log', 'restroom');
create type photo_visibility as enum ('public', 'friends', 'private');
create type moderation_status as enum ('pending', 'approved', 'rejected');
create type merge_status     as enum ('pending', 'merged', 'rejected');
create type default_screen   as enum ('map', 'feed', 'poop_map', 'profile');

-- ============================================================
-- profiles  (1:1 with auth.users)
-- ============================================================
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text unique not null,
  display_name     text,
  avatar_url       text,
  bio              text,
  default_screen   default_screen not null default 'map',
  show_log_photos  boolean not null default false,   -- viewer opt-in for poop photos
  notif_prefs      jsonb   not null default '{}'::jsonb,
  is_admin         boolean not null default false,
  followers_count  integer not null default 0,
  following_count  integer not null default 0,
  logs_count       integer not null default 0,
  created_at       timestamptz not null default now()
);
create index profiles_username_trgm on profiles using gin (username gin_trgm_ops);

-- ============================================================
-- restrooms  (wiki-style public objects; only location required)
-- ============================================================
create table restrooms (
  id             uuid primary key default gen_random_uuid(),
  name           text,
  geog           geography(point, 4326) not null,   -- required location
  lat            double precision not null,
  lng            double precision not null,
  address        text,
  city           text,
  state          text,
  country        text,
  directions     text,                               -- findability
  access_type    access_type,
  fee            boolean,
  fee_amount     text,
  hours          text,                               -- freeform / opening_hours
  operator       text,
  level          text,                               -- floor
  indoor         boolean,
  accessible     boolean,                            -- ADA / wheelchair
  unisex         boolean,                            -- gender-neutral
  changing_table boolean,
  description    text,
  status         restroom_status not null default 'open',
  last_verified  timestamptz,
  added_by       uuid references profiles(id) on delete set null,   -- null if seeded
  source         restroom_source not null default 'user',
  merged_into    uuid references restrooms(id) on delete set null,
  search_tsv     tsvector,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index restrooms_geog_gix   on restrooms using gist (geog);
create index restrooms_search_gin on restrooms using gin (search_tsv);
create index restrooms_status_idx on restrooms (status);

create or replace function restrooms_maintain() returns trigger language plpgsql as $$
begin
  new.geog := geography(st_setsrid(st_makepoint(new.lng, new.lat), 4326));
  new.search_tsv := to_tsvector('simple',
    coalesce(new.name,'')||' '||coalesce(new.address,'')||' '||
    coalesce(new.city,'')||' '||coalesce(new.description,''));
  new.updated_at := now();
  return new;
end $$;
create trigger trg_restrooms_maintain before insert or update on restrooms
  for each row execute function restrooms_maintain();

-- edit history (wiki last-write-wins + audit/revert)
create table restroom_edits (
  id          uuid primary key default gen_random_uuid(),
  restroom_id uuid not null references restrooms(id) on delete cascade,
  editor_id   uuid references profiles(id) on delete set null,
  field       text not null,
  old_value   text,
  new_value   text,
  created_at  timestamptz not null default now()
);
create index restroom_edits_restroom_idx on restroom_edits (restroom_id, created_at desc);

-- duplicate merge requests
create table merge_requests (
  id           uuid primary key default gen_random_uuid(),
  restroom_a   uuid not null references restrooms(id) on delete cascade,
  restroom_b   uuid not null references restrooms(id) on delete cascade,
  reporter_id  uuid references profiles(id) on delete set null,
  status       merge_status not null default 'pending',
  created_at   timestamptz not null default now()
);

-- ============================================================
-- codes  (store all rows; UI shows recent 5)
-- ============================================================
create table codes (
  id          uuid primary key default gen_random_uuid(),
  restroom_id uuid not null references restrooms(id) on delete cascade,
  code        text not null,
  posted_by   uuid references profiles(id) on delete set null,
  posted_at   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index codes_restroom_idx on codes (restroom_id, posted_at desc);

-- ============================================================
-- reviews  (public; about the place)
-- ============================================================
create table reviews (
  id             uuid primary key default gen_random_uuid(),
  restroom_id    uuid not null references restrooms(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  overall_rating smallint check (overall_rating between 1 and 5),
  sub_ratings    jsonb not null default '{}'::jsonb,   -- {cleanliness:1-5, privacy:1-5, ...}
  description    text,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index reviews_restroom_idx on reviews (restroom_id, created_at desc) where deleted_at is null;

-- ============================================================
-- logs  (humor-first; only location required; private/friends)
-- ============================================================
create table logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  restroom_id  uuid references restrooms(id) on delete set null,   -- optional
  lat          double precision not null,   -- required location
  lng          double precision not null,
  geog         geography(point, 4326) not null,
  rating       smallint check (rating between 1 and 5),
  bristol_type smallint check (bristol_type between 1 and 7),
  caption      text,
  relief       smallint,   -- optional scale
  effort       smallint,   -- optional scale
  cleanup      text,       -- "one-wiper" / "ghost" / count
  visibility   log_visibility not null default 'friends',
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index logs_user_idx on logs (user_id, created_at desc) where deleted_at is null;
create index logs_geog_gix on logs using gist (geog);

create or replace function logs_maintain() returns trigger language plpgsql as $$
begin
  new.geog := geography(st_setsrid(st_makepoint(new.lng, new.lat), 4326));
  new.updated_at := now();
  return new;
end $$;
create trigger trg_logs_maintain before insert or update on logs
  for each row execute function logs_maintain();

-- ============================================================
-- tags  (shared vocabulary + fuzzy dedup)
-- ============================================================
create table tags (
  id             uuid primary key default gen_random_uuid(),
  label          text not null,
  normalized_key text unique not null,
  usage_count    integer not null default 0,
  merged_into    uuid references tags(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index tags_key_trgm on tags using gin (normalized_key gin_trgm_ops);

create table restroom_tags (
  restroom_id uuid not null references restrooms(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (restroom_id, tag_id)
);
create table log_tags (
  log_id uuid not null references logs(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (log_id, tag_id)
);

-- ============================================================
-- votes  (polymorphic: codes + reviews)
-- ============================================================
create table votes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  target_type vote_target not null,
  target_id   uuid not null,
  value       smallint not null check (value in (-1, 1)),
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

-- ============================================================
-- social graph: follows (private-account request/approve)
-- ============================================================
create table follows (
  id          uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  status      follow_status not null default 'pending',
  created_at  timestamptz not null default now(),
  unique (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on follows (followee_id, status);

-- helper: is `viewer` an approved follower of `owner`?
create or replace function is_approved_follower(viewer uuid, owner uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from follows
    where follower_id = viewer and followee_id = owner and status = 'approved'
  );
$$;

-- helper: can `viewer` see `log`?
create or replace function can_see_log(viewer uuid, log_owner uuid, vis log_visibility, del timestamptz)
returns boolean language sql stable as $$
  select del is null and (
    viewer = log_owner
    or (vis = 'friends' and is_approved_follower(viewer, log_owner))
  );
$$;

-- ============================================================
-- comments (on logs; single-level replies) + reactions
-- ============================================================
create table comments (
  id         uuid primary key default gen_random_uuid(),
  log_id     uuid not null references logs(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  parent_id  uuid references comments(id) on delete cascade,   -- one level only
  text       text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index comments_log_idx on comments (log_id, created_at) where deleted_at is null;

create table reactions (
  id         uuid primary key default gen_random_uuid(),
  log_id     uuid not null references logs(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,   -- emoji key
  created_at timestamptz not null default now(),
  unique (log_id, user_id)     -- one reaction per user per log, type changeable
);

-- ============================================================
-- photos (own table; visibility + moderation per photo)
-- ============================================================
create table photos (
  id                uuid primary key default gen_random_uuid(),
  uploaded_by       uuid references profiles(id) on delete set null,
  owner_type        photo_owner not null,
  owner_id          uuid not null,
  url               text not null,
  thumb_url         text,
  visibility        photo_visibility not null default 'public',
  moderation_status moderation_status not null default 'pending',
  created_at        timestamptz not null default now()
);
create index photos_owner_idx on photos (owner_type, owner_id);

-- ============================================================
-- moderation: reports + blocks
-- ============================================================
create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type report_target not null,
  target_id   uuid not null,
  reason      text not null,
  note        text,
  status      report_status not null default 'pending',
  created_at  timestamptz not null default now()
);
create index reports_status_idx on reports (status, created_at);

create table blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ============================================================
-- notifications + device tokens
-- ============================================================
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type         text not null,
  actor_id     uuid references profiles(id) on delete set null,
  target_type  text,
  target_id    uuid,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);
create index notifications_recipient_idx on notifications (recipient_id, created_at desc);

create table device_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  expo_push_token text unique not null,
  platform        text,
  last_seen       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table profiles       enable row level security;
alter table restrooms      enable row level security;
alter table restroom_edits enable row level security;
alter table merge_requests enable row level security;
alter table codes          enable row level security;
alter table reviews        enable row level security;
alter table logs           enable row level security;
alter table tags           enable row level security;
alter table restroom_tags  enable row level security;
alter table log_tags       enable row level security;
alter table votes          enable row level security;
alter table follows        enable row level security;
alter table comments       enable row level security;
alter table reactions      enable row level security;
alter table photos         enable row level security;
alter table reports        enable row level security;
alter table blocks         enable row level security;
alter table notifications  enable row level security;
alter table device_tokens  enable row level security;

-- Public utility layer: readable by everyone (incl. anonymous, for browse-without-account),
-- writable by any authenticated user.
create policy read_all  on profiles      for select using (true);
create policy read_all  on restrooms     for select using (true);
create policy read_all  on codes         for select using (true);
create policy read_all  on reviews       for select using (deleted_at is null);
create policy read_all  on tags          for select using (true);
create policy read_all  on restroom_tags for select using (true);

create policy write_auth on restrooms     for insert with check (auth.uid() is not null);
create policy edit_auth  on restrooms     for update using (auth.uid() is not null);
create policy write_auth on codes         for insert with check (auth.uid() is not null);
create policy write_auth on tags          for insert with check (auth.uid() is not null);
create policy write_auth on restroom_tags for insert with check (auth.uid() is not null);

-- Reviews: anyone reads; author writes/edits/soft-deletes their own.
create policy insert_own on reviews for insert with check (auth.uid() = user_id);
create policy update_own on reviews for update using (auth.uid() = user_id);

-- profiles: user updates only their own row.
create policy update_own on profiles for update using (auth.uid() = id);

-- logs: visibility-gated read; owner-only writes.
create policy read_visible on logs for select
  using (can_see_log(auth.uid(), user_id, visibility, deleted_at));
create policy insert_own   on logs for insert with check (auth.uid() = user_id);
create policy update_own   on logs for update using (auth.uid() = user_id);

-- log_tags: visible if the parent log is visible.
create policy read_via_log on log_tags for select using (
  exists (select 1 from logs l
          where l.id = log_id
            and can_see_log(auth.uid(), l.user_id, l.visibility, l.deleted_at)));
create policy write_own_log on log_tags for insert with check (
  exists (select 1 from logs l where l.id = log_id and l.user_id = auth.uid()));

-- votes: user manages only their own votes; reads open.
create policy read_all   on votes for select using (true);
create policy manage_own on votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- follows: the two parties can see the row; requester creates; followee approves.
create policy read_involved on follows for select
  using (auth.uid() = follower_id or auth.uid() = followee_id);
create policy request_follow on follows for insert with check (auth.uid() = follower_id);
create policy respond_follow on follows for update using (auth.uid() = followee_id);
create policy unfollow       on follows for delete using (auth.uid() = follower_id);

-- comments/reactions: visible if the parent log is visible; author writes.
create policy read_via_log on comments for select using (
  exists (select 1 from logs l
          where l.id = log_id
            and can_see_log(auth.uid(), l.user_id, l.visibility, l.deleted_at))
  and deleted_at is null);
create policy insert_own on comments for insert with check (auth.uid() = user_id);
create policy update_own on comments for update using (auth.uid() = user_id);

create policy read_via_log on reactions for select using (
  exists (select 1 from logs l
          where l.id = log_id
            and can_see_log(auth.uid(), l.user_id, l.visibility, l.deleted_at)));
create policy manage_own on reactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- photos: approved public photos readable by all; friends/private gated by parent log;
-- pending/own visible to uploader.
create policy read_photos on photos for select using (
  auth.uid() = uploaded_by
  or (moderation_status = 'approved' and (
        visibility = 'public'
        or (owner_type = 'log' and exists (
              select 1 from logs l
              where l.id = owner_id
                and can_see_log(auth.uid(), l.user_id, l.visibility, l.deleted_at)))
     )));
create policy insert_own on photos for insert with check (auth.uid() = uploaded_by);

-- reports/blocks: user manages only their own.
create policy insert_own on reports for insert with check (auth.uid() = reporter_id);
create policy read_own   on reports for select using (auth.uid() = reporter_id);
create policy manage_own on blocks  for all
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- notifications/device_tokens: strictly the owner's.
create policy own_only on notifications for all
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
create policy own_only on device_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- restroom_edits: readable by all (transparency); insert by any authed user.
create policy read_all   on restroom_edits for select using (true);
create policy write_auth on restroom_edits for insert with check (auth.uid() is not null);

-- merge_requests: any authed user can propose + read.
create policy read_all   on merge_requests for select using (true);
create policy write_auth on merge_requests for insert with check (auth.uid() is not null);

-- ============================================================
-- auth: auto-create a profile row on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8))
  on conflict (id) do nothing;
  return new;
end
$fn$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- NOTE: admin access to the report/merge queue and privileged mutations
-- (moderation actions, merges, denormalized-count maintenance, seed import,
-- account delete/export) run through Edge Functions using the service role,
-- which bypasses RLS. is_admin gates any in-app admin surface.
