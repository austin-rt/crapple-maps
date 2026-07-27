-- Keep profiles.followers_count / following_count in sync with the follows table
-- (only 'approved' edges count). Fixes stale counters and maintains them on
-- every follow insert/update/delete.

create or replace function follows_count_sync() returns trigger language plpgsql as $$
declare aff uuid[];
begin
  aff := array_remove(array[
    coalesce(new.follower_id, old.follower_id),
    coalesce(new.followee_id, old.followee_id)
  ], null);
  update profiles p set
    followers_count = (select count(*) from follows f where f.followee_id = p.id and f.status = 'approved'),
    following_count = (select count(*) from follows f where f.follower_id = p.id and f.status = 'approved')
  where p.id = any (aff);
  return null;
end $$;

drop trigger if exists trg_follows_count on follows;
create trigger trg_follows_count
  after insert or update or delete on follows
  for each row execute function follows_count_sync();

-- one-time backfill of existing rows
update profiles p set
  followers_count = (select count(*) from follows f where f.followee_id = p.id and f.status = 'approved'),
  following_count = (select count(*) from follows f where f.follower_id = p.id and f.status = 'approved');
