-- Lets a user remove someone from their followers (or decline a request): the
-- followee may delete a follows row pointing at them. Unfollowing stays with
-- the follower via the existing `unfollow` policy.
create policy remove_follower on follows for delete using (auth.uid() = followee_id);
