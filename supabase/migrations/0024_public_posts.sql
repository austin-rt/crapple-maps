-- Public posts are readable by anyone. Comments, reactions and log photos all
-- check visibility through this function, so they follow automatically.
create or replace function public.can_see_log(viewer uuid, log_owner uuid, vis public.log_visibility, del timestamptz)
returns boolean
language sql
stable
set search_path to 'public', 'extensions', 'pg_temp'
as $$
  select del is null and (
    viewer = log_owner
    or vis = 'public'
    or (vis = 'friends' and is_approved_follower(viewer, log_owner))
  );
$$;

-- Account-level choice that new posts start with.
alter table public.profiles
  add column default_visibility public.log_visibility not null default 'friends';
