-- Finder filters "No code" / "No purchase" / "Free" must match only CONFIRMED
-- false, not unknown (NULL). Previously `is not true` included NULLs, so restrooms
-- with unknown code/purchase/fee showed under those filters. Switch to `is false`.
CREATE OR REPLACE FUNCTION public.nearby_restrooms_v2(in_lat double precision, in_lng double precision, in_limit integer DEFAULT 40, in_offset integer DEFAULT 0, p_sort text DEFAULT 'near'::text, p_public_only boolean DEFAULT false, p_unisex boolean DEFAULT false, p_accessible boolean DEFAULT false, p_changing_table boolean DEFAULT false, p_no_code boolean DEFAULT false, p_no_purchase boolean DEFAULT false, p_free boolean DEFAULT false, p_min_rating numeric DEFAULT NULL::numeric)
 RETURNS TABLE(id uuid, name text, lat double precision, lng double precision, address text, access_type access_type, accessible boolean, unisex boolean, changing_table boolean, requires_code boolean, purchase_required boolean, dist_m double precision, avg_rating numeric, review_count integer, log_count integer)
 LANGUAGE sql
 STABLE
AS $function$
  with pt as (select geography(st_setsrid(st_makepoint(in_lng, in_lat), 4326)) as g),
  cand as (
    select r.id, r.name, r.lat, r.lng, r.address, r.access_type, r.accessible, r.unisex,
           r.changing_table, r.requires_code, r.purchase_required,
           st_distance(r.geog, (select g from pt)) as d
    from restrooms r
    where (not p_public_only or r.access_type = 'public')
      and (not p_unisex or r.unisex is true)
      and (not p_accessible or r.accessible is true)
      and (not p_changing_table or r.changing_table is true)
      and (not p_no_code or r.requires_code is false)
      and (not p_no_purchase or r.purchase_required is false)
      and (not p_free or r.fee is false)
    order by r.geog <-> (select g from pt) limit 1000
  ),
  agg as (
    select c.*,
      (select avg(rv.overall_rating) from reviews rv where rv.restroom_id = c.id and rv.deleted_at is null and rv.overall_rating is not null) as avg_rating,
      (select count(*) from reviews rv where rv.restroom_id = c.id and rv.deleted_at is null)::int as review_count,
      (select count(*) from logs l where l.restroom_id = c.id and l.deleted_at is null)::int as log_count
    from cand c
  )
  select id, name, lat, lng, address, access_type, accessible, unisex, changing_table,
         requires_code, purchase_required, d as dist_m, avg_rating, review_count, log_count
  from agg
  where (p_min_rating is null or coalesce(avg_rating, 0) >= p_min_rating)
  order by
    (case when p_sort = 'rating' then coalesce(avg_rating, -1) else null end) desc nulls last,
    (case when p_sort = 'popular' then log_count else null end) desc nulls last,
    d asc
  limit in_limit offset in_offset;
$function$
