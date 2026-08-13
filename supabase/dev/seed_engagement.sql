-- Adds photos, likes, and comments to the seeded feed logs so the post-detail
-- page shows 1-photo, multi-photo, liked, and commented states. Idempotent for
-- the seed logs (user_id like 'aaaaaaa0-%').
--
-- Photos are CC0 1.0 (public domain, no attribution required), sourced via
-- Openverse and re-hosted in the log-photos bucket under seed/. They are
-- grouped into tiers 1-5 and only ever attach to a log whose rating matches the
-- tier, so a one-star post shows a peeling, rusted urinal and a five-star post
-- shows a spotless one. Previously this pointed at picsum.photos, which served
-- random stock scenery — flowers and railway tracks under restroom reviews.

-- Clean prior engagement seed.
--
-- `photos` is polymorphic (owner_type + owner_id, deliberately no FK), so
-- deleting a log does NOT cascade to its photos. seed_feed.sql runs first and
-- removes the seed users, cascading their logs away — by the time we get here
-- the "owner_id in (select ... from logs)" clause matches nothing and the old
-- rows are orphaned, not deleted. It reported DELETE 0 while leaking 57 rows.
-- So sweep orphans (owner_type='log' pointing at a log that no longer exists)
-- as well as photos still attached to live seed logs.
delete from photos
 where owner_type = 'log'
   and (owner_id in (select id from logs where user_id::text like 'aaaaaaa0-%')
        or not exists (select 1 from logs l where l.id = photos.owner_id));
delete from reactions where log_id in (select id from logs where user_id::text like 'aaaaaaa0-%');
delete from comments  where log_id in (select id from logs where user_id::text like 'aaaaaaa0-%');

-- tiered photo catalog: tier == the log rating it may illustrate
create temporary table seed_photo_catalog (tier int, url text) on commit drop;
insert into seed_photo_catalog (tier, url) values
  (1, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r1-00.jpg'),
  (1, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r1-01.jpg'),
  (1, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r1-02.jpg'),
  (1, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r1-03.jpg'),
  (2, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r2-00.jpg'),
  (2, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r2-01.jpg'),
  (2, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r2-02.jpg'),
  (2, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r2-03.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-00.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-01.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-02.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-03.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-04.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-05.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-06.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-07.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-08.jpg'),
  (3, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r3-09.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-00.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-01.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-02.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-03.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-04.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-05.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-06.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-07.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-08.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-09.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-10.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-11.jpg'),
  (4, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r4-12.jpg'),
  (5, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r5-00.jpg'),
  (5, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r5-01.jpg'),
  (5, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r5-02.jpg'),
  (5, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r5-03.jpg'),
  (5, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r5-04.jpg'),
  (5, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r5-05.jpg');

-- bulk logs: every 5th gets 3 photos, every 3rd 2, every 2nd 1, rest none —
-- always drawn from the tier matching that log's own rating.
insert into photos (uploaded_by, owner_type, owner_id, url, visibility, moderation_status)
select l.user_id, 'log', l.id, p.url, 'friends', 'approved'
from (
  select id, user_id, rating, row_number() over (order by created_at) as rn
  from logs
  where user_id::text like 'aaaaaaa0-%'
    and id not in ('10900000-0000-0000-0000-000000000001',
                   '10900000-0000-0000-0000-000000000002')
) l
join lateral (
  select c.url from seed_photo_catalog c
  where c.tier = l.rating
  order by random()
  limit (case when l.rn % 5 = 0 then 3 when l.rn % 3 = 0 then 2
              when l.rn % 2 = 0 then 1 else 0 end)
) p on true;

-- The two pinned posts get fixed photo sets in a fixed order, because these are
-- the ones the App Store screenshot shows. Two photos each, not three: a third
-- row on the top post pushes the second post's like/comment row under the tab
-- bar, so the screenshot cuts a card in half.
insert into photos (uploaded_by, owner_type, owner_id, url, visibility, moderation_status, created_at)
select l.user_id, 'log', v.log_id, v.url, 'friends', 'approved',
       l.created_at + (v.ord || ' seconds')::interval
from (values
  ('10900000-0000-0000-0000-000000000001'::uuid, 0, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r5-00.jpg'),
  ('10900000-0000-0000-0000-000000000001'::uuid, 1, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r5-01.jpg'),
  ('10900000-0000-0000-0000-000000000002'::uuid, 0, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r1-00.jpg'),
  ('10900000-0000-0000-0000-000000000002'::uuid, 1, 'https://obxrsxrtqkegwmzxbkdc.supabase.co/storage/v1/object/public/log-photos/seed/r1-03.jpg')
) as v(log_id, ord, url)
join logs l on l.id = v.log_id;

-- likes: ~35% chance per (user, log), across the 10 authors + demo
insert into reactions (log_id, user_id, type)
select l.id, u.id, 'like'
from (select id from logs where user_id::text like 'aaaaaaa0-%') l
cross join (select id from profiles where id::text like 'aaaaaaa0-%' or id::text like 'dededede-%') u
where random() < 0.35
on conflict (log_id, user_id) do nothing;

-- comments: 0-2 per log from random seed users
insert into comments (log_id, user_id, text)
select l.id, u.id,
       (array[
         'same, clutch spot',
         'underrated find',
         'does the code still work?',
         'saving this one',
         'ha, been there',
         'solid rating',
         'adding to my list'
       ])[1 + floor(random() * 7)::int]
from (select id from logs where user_id::text like 'aaaaaaa0-%') l
cross join lateral (
  select id from profiles
  where id::text like 'aaaaaaa0-%' or id::text like 'dededede-%'
  order by random()
  limit (floor(random() * 3))::int
) u;

-- report
select
  (select count(*) from photos    where owner_type='log' and owner_id in (select id from logs where user_id::text like 'aaaaaaa0-%')) as photos,
  (select count(distinct owner_id) from photos where owner_type='log' and owner_id in (select id from logs where user_id::text like 'aaaaaaa0-%')) as logs_with_photos,
  (select count(*) from reactions where log_id in (select id from logs where user_id::text like 'aaaaaaa0-%')) as likes,
  (select count(*) from comments  where log_id in (select id from logs where user_id::text like 'aaaaaaa0-%')) as comments;
