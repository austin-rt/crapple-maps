-- Handles no longer leak real names. Sign-up used to build the username from
-- the email's local part (adampangburn_fed3489f); new accounts now get a random
-- neutral handle like swift_otter_4821, and are asked once to keep or change it
-- (profiles.username_chosen drives that prompt in the app). Existing
-- email-derived handles are randomized the same way.
--
-- New accounts also start out following the founder account (@austinrt),
-- already approved, so a fresh feed isn't empty.

create or replace function public.random_handle()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  adjectives text[] := array['swift','brave','calm','clever','cosmic','crisp','daring','dizzy','eager','fuzzy',
    'gentle','golden','happy','jolly','lucky','mellow','mighty','misty','nimble','noble','plucky','quiet','rapid',
    'rosy','rusty','sly','snappy','sunny','tidy','witty','zesty','breezy','chill','frosty','peppy','sleepy'];
  nouns text[] := array['otter','falcon','badger','heron','lynx','panda','koala','gecko','walrus','moose','raven',
    'yak','bison','crane','dingo','ferret','finch','ibex','lemur','marmot','newt','ocelot','puffin','quokka',
    'robin','seal','tapir','toucan','vole','wombat','zebra','alpaca','beaver','cobra','egret','hare'];
  candidate text;
begin
  loop
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int] || '_' ||
                 nouns[1 + floor(random() * array_length(nouns, 1))::int] || '_' ||
                 (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from public.profiles where username = candidate);
  end loop;
  return candidate;
end
$$;

alter table public.profiles add column if not exists username_chosen boolean not null default false;
update public.profiles set username_chosen = true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  founder uuid := '532fd4ed-88bf-4c94-b9f6-9f53440c9c60';
begin
  insert into public.profiles (id, username, username_chosen)
  values (new.id, public.random_handle(), false)
  on conflict (id) do nothing;

  if new.id <> founder and exists (select 1 from public.profiles where id = founder) then
    insert into public.follows (follower_id, followee_id, status)
    values (new.id, founder, 'approved')
    on conflict (follower_id, followee_id) do nothing;
  end if;
  return new;
end
$$;

update public.profiles
set username = public.random_handle(), username_chosen = false
where username ~ '_[0-9a-f]{8}$';
