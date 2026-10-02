-- follows_count_sync ran as the invoking user, so profile RLS (update_own)
-- blocked it from updating the *other* person's counts: approving a request
-- left the follower's following_count stale, and removing a follower left
-- theirs stale too. Run it as the owner and recompute every count once.
alter function public.follows_count_sync() security definer;

update public.profiles p set
  followers_count = (select count(*) from public.follows f where f.followee_id = p.id and f.status = 'approved'),
  following_count = (select count(*) from public.follows f where f.follower_id = p.id and f.status = 'approved');
