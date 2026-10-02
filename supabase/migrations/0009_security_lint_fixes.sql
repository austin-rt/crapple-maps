-- Applied 2026-08-04 (remote version 20260804221734) in response to the
-- Supabase security advisor. Recorded here for the record; already live.
--
-- Two classes of fix:
--   1. Trigger/webhook functions were callable over the REST API by anyone.
--      They are only ever meant to fire from a trigger, so revoke EXECUTE.
--   2. Every app function had an unpinned search_path, so a caller able to
--      create objects on the search path could shadow a referenced table or
--      operator. Pin it.
--
-- NOT fixed here, because it is not fixable at our privilege level: the
-- rls_disabled_in_public ERROR on public.spatial_ref_sys. That table belongs
-- to the postgis extension (owner supabase_admin, extrelocatable = false), so
-- `postgres` can neither enable RLS on it, revoke the grants supabase_admin
-- made, nor relocate the extension out of public. The revoke below is
-- deliberately omitted rather than left in as a silent no-op.

revoke all on function public.handle_new_user()   from anon, authenticated, public;
revoke all on function public.feedback_to_github() from anon, authenticated, public;

alter function public.follows_count_sync()         set search_path = public, extensions, pg_temp;
alter function public.logs_maintain()              set search_path = public, extensions, pg_temp;
alter function public.restrooms_maintain()         set search_path = public, extensions, pg_temp;
alter function public.restrooms_normalize_name()   set search_path = public, extensions, pg_temp;
alter function public.normalize_name(n text)       set search_path = public, extensions, pg_temp;

alter function public.can_see_log(
  viewer uuid, log_owner uuid, vis log_visibility, del timestamptz)
  set search_path = public, extensions, pg_temp;
alter function public.is_approved_follower(viewer uuid, owner uuid)
  set search_path = public, extensions, pg_temp;

alter function public.nearby_restrooms(
  in_lat double precision, in_lng double precision, in_limit integer)
  set search_path = public, extensions, pg_temp;
alter function public.nearby_restrooms(
  in_lat double precision, in_lng double precision, in_limit integer, in_offset integer)
  set search_path = public, extensions, pg_temp;
alter function public.nearby_restrooms_v2(
  in_lat double precision, in_lng double precision, in_limit integer, in_offset integer,
  p_sort text, p_public_only boolean, p_unisex boolean, p_accessible boolean,
  p_changing_table boolean, p_no_code boolean, p_no_purchase boolean, p_free boolean,
  p_min_rating numeric)
  set search_path = public, extensions, pg_temp;
