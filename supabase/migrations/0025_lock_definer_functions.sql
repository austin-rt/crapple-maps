-- Trigger functions run as their owner when the trigger fires; nobody needs to
-- call them over the API.
revoke execute on function public.follows_notify() from public, anon, authenticated;
revoke execute on function public.reactions_notify() from public, anon, authenticated;
revoke execute on function public.comments_notify() from public, anon, authenticated;
revoke execute on function public.follows_count_sync() from public, anon, authenticated;

-- Toilet paper tallies live in a table kept current by a trigger, so reading
-- them needs no SECURITY DEFINER function. Private logs never count.
create table public.restroom_tp_counts (
  restroom_id uuid not null references public.restrooms(id) on delete cascade,
  tp_quality smallint not null,
  reports integer not null,
  primary key (restroom_id, tp_quality)
);
alter table public.restroom_tp_counts enable row level security;
create policy read_all on public.restroom_tp_counts for select using (true);
revoke insert, update, delete on public.restroom_tp_counts from anon, authenticated;

create or replace function public.refresh_restroom_tp(p_restroom_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.restroom_tp_counts where restroom_id = p_restroom_id;
  insert into public.restroom_tp_counts (restroom_id, tp_quality, reports)
  select p_restroom_id, l.tp_quality, count(*)
  from public.logs l
  where l.restroom_id = p_restroom_id
    and l.deleted_at is null
    and l.tp_quality is not null
    and l.visibility <> 'private'
  group by l.tp_quality;
$$;
revoke execute on function public.refresh_restroom_tp(uuid) from public, anon, authenticated;

create or replace function public.logs_tp_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' and old.restroom_id is not null then
    perform public.refresh_restroom_tp(old.restroom_id);
  end if;
  if tg_op <> 'DELETE' and new.restroom_id is not null
     and (tg_op = 'INSERT' or new.restroom_id is distinct from old.restroom_id) then
    perform public.refresh_restroom_tp(new.restroom_id);
  end if;
  return null;
end;
$$;
revoke execute on function public.logs_tp_counts() from public, anon, authenticated;

create trigger logs_tp_counts
  after insert or delete or update of tp_quality, restroom_id, visibility, deleted_at on public.logs
  for each row execute function public.logs_tp_counts();

insert into public.restroom_tp_counts (restroom_id, tp_quality, reports)
select l.restroom_id, l.tp_quality, count(*)
from public.logs l
where l.restroom_id is not null and l.deleted_at is null and l.tp_quality is not null and l.visibility <> 'private'
group by l.restroom_id, l.tp_quality;

-- Same signature the app already calls, now an ordinary invoker-rights read.
create or replace function public.restroom_tp_summary(p_restroom_id uuid)
returns table (tp_quality smallint, reports bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.tp_quality, c.reports::bigint from public.restroom_tp_counts c where c.restroom_id = p_restroom_id
$$;
