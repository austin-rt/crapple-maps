-- Dev seed: a primary "me" user (demo@cm.seed / demopass1), 10 authors it
-- approve-follows, and ~40 friends-visibility logs on real Atlanta restrooms so
-- the feed populates. Marker = email domain @cm.seed (cleanup deletes by it).

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

-- 4. dozens of logs: each author posts at 4 random real restrooms
insert into logs (user_id, restroom_id, lat, lng, rating, bristol_type, caption, visibility, created_at)
select a.id,
       r.id, r.lat, r.lng,
       1 + floor(random() * 5)::int,
       1 + floor(random() * 7)::int,
       (array[
         'clutch find, back on the road in five',
         'ten out of ten, would go again',
         'spotless and no code needed',
         'saved me during the expo',
         'hidden gem behind the coffee bar',
         'soap, paper, and a hook, living the dream',
         'quick pit stop, zero regrets',
         'code was on the receipt, pro move',
         'emergency handled with dignity',
         'surprisingly nice for a gas station',
         'in and out, mission accomplished',
         'the throne everyone deserves'
       ])[1 + floor(random() * 12)::int],
       'friends',
       now() - (random() * 14 || ' days')::interval - (random() * 24 || ' hours')::interval
from (select id from profiles where id::text like 'aaaaaaa0-%') a
cross join lateral (
  select id, lat, lng from restrooms
  where lat between 33.6 and 33.9 and lng between -84.5 and -84.2
  order by random() limit 4
) r;

-- report what we made
select
  (select count(*) from profiles where id::text like 'aaaaaaa0-%' or id::text like 'dededede-%') as users,
  (select count(*) from logs   where user_id::text like 'aaaaaaa0-%') as logs,
  (select count(*) from follows where follower_id::text like 'dededede-%') as demo_follows;
