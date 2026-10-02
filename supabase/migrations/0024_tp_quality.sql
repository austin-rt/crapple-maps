-- Toilet paper quality on a log: 1 none, 2 sandpaper, 3 decent, 4 plush.
alter table public.logs
  add column tp_quality smallint check (tp_quality between 1 and 4);

-- Per-restroom tally for the restroom sheet. Security definer so it can count
-- friends-only logs the caller can't read; it returns counts only, and private
-- logs never count.
create or replace function public.restroom_tp_summary(p_restroom_id uuid)
returns table (tp_quality smallint, reports bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select l.tp_quality, count(*) as reports
  from public.logs l
  where l.restroom_id = p_restroom_id
    and l.deleted_at is null
    and l.tp_quality is not null
    and l.visibility <> 'private'
  group by l.tp_quality
$$;

revoke all on function public.restroom_tp_summary(uuid) from public;
grant execute on function public.restroom_tp_summary(uuid) to anon, authenticated;
