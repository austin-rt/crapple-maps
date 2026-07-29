-- Add `hours` to the finder RPC so list rows can show open/closed.
-- Return-type changes require drop + recreate. Additive for clients: old app
-- versions ignore the extra column.
drop function if exists public.nearby_restrooms_v2(double precision, double precision, integer, integer, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, numeric);

create function public.nearby_restrooms_v2(
  in_lat double precision,
  in_lng double precision,
  in_limit integer default 40,
  in_offset integer default 0,
  p_sort text default 'near',
  p_public_only boolean default false,
  p_unisex boolean default false,
  p_accessible boolean default false,
  p_changing_table boolean default false,
  p_no_code boolean default false,
  p_no_purchase boolean default false,
  p_free boolean default false,
  p_min_rating numeric default null
)
returns table(
  id uuid, name text, lat double precision, lng double precision, address text,
  hours text, access_type access_type, accessible boolean, unisex boolean,
  changing_table boolean, requires_code boolean, purchase_required boolean,
  dist_m double precision, avg_rating numeric, review_count integer, log_count integer
)
language sql stable
as $function$
  with pt as (select geography(st_setsrid(st_makepoint(in_lng, in_lat), 4326)) as g),
  cand as (
    select r.id, r.name, r.lat, r.lng, r.address, r.hours, r.access_type, r.accessible, r.unisex,
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
  select id, name, lat, lng, address, hours, access_type, accessible, unisex, changing_table,
         requires_code, purchase_required, d as dist_m, avg_rating, review_count, log_count
  from agg
  where (p_min_rating is null or coalesce(avg_rating, 0) >= p_min_rating)
  order by
    (case when p_sort = 'rating' then coalesce(avg_rating, -1) else null end) desc nulls last,
    (case when p_sort = 'popular' then log_count else null end) desc nulls last,
    d asc
  limit in_limit offset in_offset;
$function$;
