-- Schema that production picked up outside the migration files (dashboard /
-- ad-hoc SQL) before 0005 relied on it. Recorded here so a fresh project — the
-- dev project — builds the same schema. Everything is IF NOT EXISTS, so this is
-- a no-op on production.
--
-- Production also has a feedback_to_github trigger on public.feedback (files
-- each contact-form message as a GitHub issue). It is deliberately not created
-- here, so dev feedback never opens real issues.

-- pg_net backs the profile-card trigger's HTTP call (0010); production enabled
-- it from the dashboard.
create extension if not exists pg_net;

alter table public.profiles add column if not exists avatar_seed text;

alter table public.restrooms add column if not exists purchase_required boolean;
alter table public.restrooms add column if not exists source_id text;
alter table public.restrooms add column if not exists requires_code boolean;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  email text,
  message text not null,
  page text,
  user_agent text,
  created_at timestamptz not null default now(),
  notify_error text
);
alter table public.feedback enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'feedback' and policyname = 'insert_any') then
    create policy insert_any on public.feedback for insert to anon, authenticated
      with check (length(message) between 1 and 5000 and (email is null or length(email) <= 320));
  end if;
end
$$;

-- 0007 re-pins this function's search_path, so it must exist. Production has the
-- real GitHub-issue version; a fresh project gets a do-nothing stand-in (and no
-- trigger), created only when the function is missing.
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'feedback_to_github') then
    create function public.feedback_to_github() returns trigger language plpgsql as 'begin return new; end';
  end if;
end
$$;

-- Restroom queries that exist in production but were never in a migration.
-- Definitions copied verbatim from production.
CREATE OR REPLACE FUNCTION public.nearby_restrooms(in_lat double precision, in_lng double precision, in_limit integer DEFAULT 150)
 RETURNS TABLE(id uuid, name text, lat double precision, lng double precision, address text, access_type access_type, accessible boolean, unisex boolean, changing_table boolean, dist_m double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  select r.id, r.name, r.lat, r.lng, r.address, r.access_type, r.accessible, r.unisex, r.changing_table,
         st_distance(r.geog, geography(st_setsrid(st_makepoint(in_lng, in_lat), 4326))) as dist_m
  from restrooms r
  order by r.geog <-> geography(st_setsrid(st_makepoint(in_lng, in_lat), 4326))
  limit in_limit;
$function$;

CREATE OR REPLACE FUNCTION public.nearby_restrooms(in_lat double precision, in_lng double precision, in_limit integer DEFAULT 50, in_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, name text, lat double precision, lng double precision, address text, access_type access_type, accessible boolean, unisex boolean, changing_table boolean, dist_m double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  select r.id, r.name, r.lat, r.lng, r.address, r.access_type, r.accessible, r.unisex, r.changing_table,
         st_distance(r.geog, geography(st_setsrid(st_makepoint(in_lng, in_lat), 4326))) as dist_m
  from restrooms r
  order by r.geog <-> geography(st_setsrid(st_makepoint(in_lng, in_lat), 4326))
  limit in_limit offset in_offset;
$function$;

CREATE OR REPLACE FUNCTION public.restrooms_in_bounds(in_min_lat double precision, in_min_lng double precision, in_max_lat double precision, in_max_lng double precision, in_limit integer DEFAULT 300, p_public_only boolean DEFAULT false, p_unisex boolean DEFAULT false, p_accessible boolean DEFAULT false, p_changing_table boolean DEFAULT false, p_no_code boolean DEFAULT false, p_no_purchase boolean DEFAULT false, p_free boolean DEFAULT false, p_min_rating numeric DEFAULT NULL::numeric)
 RETURNS TABLE(id uuid, name text, lat double precision, lng double precision, address text, hours text, access_type access_type, accessible boolean, unisex boolean, changing_table boolean, requires_code boolean, purchase_required boolean, dist_m double precision, avg_rating numeric, review_count integer, log_count integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  with box as (
    select st_makeenvelope(in_min_lng, in_min_lat, in_max_lng, in_max_lat, 4326)::geography as g
  ),
  ctr as (
    select geography(st_setsrid(st_makepoint(
      (in_min_lng + in_max_lng) / 2, (in_min_lat + in_max_lat) / 2), 4326)) as g
  ),
  cand as (
    select r.id, r.name, r.lat, r.lng, r.address, r.hours, r.access_type, r.accessible,
           r.unisex, r.changing_table, r.requires_code, r.purchase_required,
           st_distance(r.geog, (select g from ctr)) as d
    from restrooms r
    where r.geog && (select g from box)
      and (not p_public_only    or r.access_type = 'public')
      and (not p_unisex         or r.unisex is true)
      and (not p_accessible     or r.accessible is true)
      and (not p_changing_table or r.changing_table is true)
      and (not p_no_code        or r.requires_code is false)
      and (not p_no_purchase    or r.purchase_required is false)
      and (not p_free           or r.fee is false)
    order by r.geog <-> (select g from ctr)
    limit least(greatest(in_limit, 1), 1000)
  ),
  agg as (
    select c.*,
      (select avg(rv.overall_rating) from reviews rv
        where rv.restroom_id = c.id and rv.deleted_at is null and rv.overall_rating is not null) as avg_rating,
      (select count(*) from reviews rv
        where rv.restroom_id = c.id and rv.deleted_at is null)::int as review_count,
      (select count(*) from logs l
        where l.restroom_id = c.id and l.deleted_at is null)::int as log_count
    from cand c
  )
  select id, name, lat, lng, address, hours, access_type, accessible, unisex, changing_table,
         requires_code, purchase_required, d as dist_m, avg_rating, review_count, log_count
  from agg
  where (p_min_rating is null or coalesce(avg_rating, 0) >= p_min_rating)
  order by d asc;
$function$;
