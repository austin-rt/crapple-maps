-- Applied 2026-08-13. The 13+ check lives entirely on the client, in front of
-- the auth screen, so no age data is stored server-side at all.
--
-- It has to run BEFORE auth rather than after: Google and Apple create the
-- account the instant the user authenticates, and Supabase has no "sign in but
-- don't create" flag for OAuth, so a post-auth check would mean creating a
-- child's account and then deleting it. Checking first means it is never
-- created and no email ever leaves the device.
--
-- Two earlier attempts stored server-side state (age_verified_at, then
-- age_eligible_at); both are dropped here. Kept as a no-op guard so a fresh
-- database doesn't inherit them.
alter table public.profiles drop column if exists age_eligible_at;
alter table public.profiles drop column if exists age_verified_at;
