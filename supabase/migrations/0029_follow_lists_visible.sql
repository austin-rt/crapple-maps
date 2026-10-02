-- Followers / Following lists on other people's profiles. An approved follow is
-- readable when you follow either person, or either account posts publicly;
-- pending requests stay visible only to the two people involved (read_involved).
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- Lives outside the API schema and bypasses RLS so the policy below can check
-- follows without recursing into its own policy.
create or replace function private.follows_approved(p_follower uuid, p_followee uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.follows f
    where f.follower_id = p_follower and f.followee_id = p_followee and f.status = 'approved'
  );
$$;
revoke all on function private.follows_approved(uuid, uuid) from public;
grant execute on function private.follows_approved(uuid, uuid) to anon, authenticated;

create policy read_visible_lists on public.follows for select using (
  status = 'approved' and (
    private.follows_approved(auth.uid(), follower_id)
    or private.follows_approved(auth.uid(), followee_id)
    or exists (
      select 1 from public.profiles p
      where p.id in (follower_id, followee_id) and p.default_visibility = 'public'
    )
  )
);
