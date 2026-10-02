-- Find someone by the exact email address you already know. Returns only the
-- public profile fields (never the email), for signed-in callers, and only on
-- a full, case-insensitive match, so emails can't be browsed or guessed by
-- fragment. Real accounts only find real accounts, like username search.
create or replace function public.find_profile_by_email(p_email text)
returns table (id uuid, username text, display_name text, avatar_url text, avatar_seed text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.avatar_seed
  from auth.users u
  join public.profiles p on p.id = u.id
  where auth.uid() is not null
    and lower(u.email) = lower(trim(p_email))
    and p.id <> auth.uid()
    and (
      p.kind = 'real'
      or coalesce((select me.kind from public.profiles me where me.id = auth.uid()), 'real') <> 'real'
    )
  limit 1;
$$;

revoke execute on function public.find_profile_by_email(text) from public, anon;
grant execute on function public.find_profile_by_email(text) to authenticated;
