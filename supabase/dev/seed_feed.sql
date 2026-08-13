-- Dev seed: a primary "me" user (demo@cm.seed / demopass1), 10 authors it
-- approve-follows, and ~40 friends-visibility logs on real Atlanta restrooms so
-- the feed populates. Marker = email domain @cm.seed (cleanup deletes by it).
--
-- Rating, caption and photo are chosen TOGETHER, never independently. Earlier
-- this drew each at random, so the feed showed things like "quick pit stop,
-- zero regrets" over two stars — which is what a reviewer or a store screenshot
-- would see. Captions live in tiered templates below; seed_engagement.sql
-- attaches photos whose tier matches the log's rating.

-- 0. wipe any prior seed (cascades to profiles/logs/follows)
delete from auth.users where email like '%@cm.seed';

-- 1. auth users (fixed ids so follows/logs can reference them)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
       u.email, crypt('demopass1', gen_salt('bf')), now(), now(), now(),
       '{"provider":"email","providers":["email"]}', '{}', '', '', '', ''
from (values
  ('dededede-0000-0000-0000-000000000000'::uuid, 'demo@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000001'::uuid, 'ava@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000002'::uuid, 'marco@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000003'::uuid, 'priya@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000004'::uuid, 'jules@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000005'::uuid, 'sam@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000006'::uuid, 'nina@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000007'::uuid, 'theo@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000008'::uuid, 'quinn@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000009'::uuid, 'dev@cm.seed'),
  ('aaaaaaa0-0000-0000-0000-000000000010'::uuid, 'lena@cm.seed')
) as u(id, email);

-- 2. fill in profile identity (trigger already created the rows)
update profiles p set username = v.username, display_name = v.name, avatar_seed = v.username
from (values
  ('dededede-0000-0000-0000-000000000000'::uuid, 'demo_me',   'Demo (you)'),
  ('aaaaaaa0-0000-0000-0000-000000000001'::uuid, 'ava_p',     'Ava Pearson'),
  ('aaaaaaa0-0000-0000-0000-000000000002'::uuid, 'marco_d',   'Marco Diaz'),
  ('aaaaaaa0-0000-0000-0000-000000000003'::uuid, 'priya_n',   'Priya Nair'),
  ('aaaaaaa0-0000-0000-0000-000000000004'::uuid, 'jules_b',   'Jules Bennett'),
  ('aaaaaaa0-0000-0000-0000-000000000005'::uuid, 'sam_o',     'Sam Okafor'),
  ('aaaaaaa0-0000-0000-0000-000000000006'::uuid, 'nina_k',    'Nina Kowalski'),
  ('aaaaaaa0-0000-0000-0000-000000000007'::uuid, 'theo_l',    'Theo Lambert'),
  ('aaaaaaa0-0000-0000-0000-000000000008'::uuid, 'quinn_a',   'Quinn Alvarez'),
  ('aaaaaaa0-0000-0000-0000-000000000009'::uuid, 'dev_s',     'Dev Sharma'),
  ('aaaaaaa0-0000-0000-0000-000000000010'::uuid, 'lena_f',    'Lena Fischer')
) as v(id, username, name)
where p.id = v.id;

-- 3. follow graph: demo approve-follows each author (so their friends logs show),
--    and each author follows demo back (realistic counts)
insert into follows (follower_id, followee_id, status)
select 'dededede-0000-0000-0000-000000000000'::uuid, a.id, 'approved'
from (select id from profiles where id::text like 'aaaaaaa0-%') a
on conflict do nothing;

insert into follows (follower_id, followee_id, status)
select a.id, 'dededede-0000-0000-0000-000000000000'::uuid, 'approved'
from (select id from profiles where id::text like 'aaaaaaa0-%') a
on conflict do nothing;

-- 4. bulk logs: each author posts at 4 random real restrooms. Rating, bristol
--    type and caption are read from PARALLEL arrays at one shared index, so the
--    caption always matches the stars it is printed under.
--
--    The index is hashed from (author, restroom) rather than drawn with
--    `order by random() limit 1` in a lateral: that subquery references no outer
--    column, so Postgres treats it as uncorrelated, evaluates it once and glues
--    the SAME caption onto every row. Hashing is correlated, varied, and has the
--    bonus of being reproducible across re-seeds.
--
--    Dated 2+ days back so the two pinned posts below stay newest.
insert into logs (user_id, restroom_id, lat, lng, rating, bristol_type, caption, visibility, created_at)
select a.id, r.id, r.lat, r.lng,
       (array[1,1,1,2,2,2,3,3,3,3,4,4,4,4,5,5,5])[t.i],
       (array[3,5,2,4,6,3,4,5,3,6,4,3,5,4,4,3,4])[t.i],
       (array[
         'no soap, no paper, and the lock was broken. keep walking.',
         'out of order for what looks like months.',
         'genuine emergencies only, and even then think hard.',
         'does the job if you hold your breath.',
         'dated and grim, but at least it was open.',
         'one working stall out of three. fine in a pinch.',
         'clean enough, nothing fancy. paper was stocked.',
         'standard mall restroom. no complaints, no praise.',
         'perfectly average, which is honestly a win some days.',
         'did the job. bit of a queue at lunchtime.',
         'clean, well lit, and no code needed.',
         'soap, paper, and a hook. living the dream.',
         'genuinely nice for a gas station. surprised.',
         'quick pit stop, zero regrets.',
         'immaculate, and the hand dryer actually works.',
         'the throne everyone deserves.',
         'spotless. worth the ten minute detour.'
       ])[t.i],
       'friends',
       now() - ((2 + random() * 12) || ' days')::interval
                - ((random() * 24) || ' hours')::interval
from (select id from profiles where id::text like 'aaaaaaa0-%') a
cross join lateral (
  select id, lat, lng from restrooms
  where lat between 33.6 and 33.9 and lng between -84.5 and -84.2
  order by random() limit 4
) r
cross join lateral (
  select 1 + (abs(hashtext(a.id::text || r.id::text)) % 17) as i
) t;

-- 5. the two newest posts are pinned, not random: they are the only ones on
--    screen in the App Store feed screenshot, so they are chosen to show the
--    rating scale actually meaning something — a five and a one, back to back.
--    Fixed ids so seed_engagement.sql can hang specific photos off them.
insert into logs (id, user_id, restroom_id, lat, lng, rating, bristol_type, caption, visibility, created_at)
select v.id, v.user_id, r.id, r.lat, r.lng, v.rating, v.bristol, v.caption, 'friends', v.created_at
from (values
  ('10900000-0000-0000-0000-000000000001'::uuid,
   'aaaaaaa0-0000-0000-0000-000000000001'::uuid, 5, 4,
   'black tile, warm light, and not a queue in sight. worth the detour.',
   now() - interval '2 hours'),
  ('10900000-0000-0000-0000-000000000002'::uuid,
   'aaaaaaa0-0000-0000-0000-000000000002'::uuid, 1, 3,
   'no soap, no paper, and the lock was broken. keep walking.',
   now() - interval '6 hours')
) as v(id, user_id, rating, bristol, caption, created_at)
cross join lateral (
  select id, lat, lng from restrooms
  where lat between 33.6 and 33.9 and lng between -84.5 and -84.2
  order by random() limit 1
) r;

-- report what we made
select
  (select count(*) from profiles where id::text like 'aaaaaaa0-%' or id::text like 'dededede-%') as users,
  (select count(*) from logs   where user_id::text like 'aaaaaaa0-%') as logs,
  (select count(*) from follows where follower_id::text like 'dededede-%') as demo_follows;
