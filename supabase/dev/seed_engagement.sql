-- Adds photos, likes, and comments to the seeded feed logs so the post-detail
-- page shows 1-photo, multi-photo, liked, and commented states. Idempotent for
-- the seed logs (user_id like 'aaaaaaa0-%').

-- clean prior engagement seed
delete from photos    where owner_type = 'log' and owner_id in (select id from logs where user_id::text like 'aaaaaaa0-%');
delete from reactions where log_id in (select id from logs where user_id::text like 'aaaaaaa0-%');
delete from comments  where log_id in (select id from logs where user_id::text like 'aaaaaaa0-%');

-- photos: every 5th log gets 3, every 3rd gets 2, every 2nd gets 1, rest none
insert into photos (uploaded_by, owner_type, owner_id, url, visibility, moderation_status)
select l.user_id, 'log', l.id,
       'https://picsum.photos/seed/' || substr(l.id::text, 1, 8) || g || '/800/600',
       'friends', 'approved'
from (
  select id, user_id, row_number() over (order by created_at) as rn
  from logs where user_id::text like 'aaaaaaa0-%'
) l
cross join generate_series(
  1,
  case when l.rn % 5 = 0 then 3 when l.rn % 3 = 0 then 2 when l.rn % 2 = 0 then 1 else 0 end
) g;

-- likes: ~35% chance per (user, log), across the 10 authors + demo
insert into reactions (log_id, user_id, type)
select l.id, u.id, 'like'
from (select id from logs where user_id::text like 'aaaaaaa0-%') l
cross join (select id from profiles where id::text like 'aaaaaaa0-%' or id::text like 'dededede-%') u
where random() < 0.35
on conflict (log_id, user_id) do nothing;

-- comments: 0–2 per log from random seed users
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
