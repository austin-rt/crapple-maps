-- A log can carry several consistency tags (Smooth and Soft, say), stored in
-- scale order with no repeats.
alter table public.logs
  add column bristol_types smallint[] not null default '{}',
  add constraint logs_bristol_types_range check (bristol_types <@ '{1,2,3,4,5,6,7}'::smallint[]);

update public.logs set bristol_types = array[bristol_type] where bristol_type is not null;

-- App builds from before this column still read and write bristol_type, so the
-- two stay in step: bristol_type is always the first tag.
create or replace function public.logs_sync_bristol_types()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.bristol_type is distinct from old.bristol_type
     and new.bristol_types is not distinct from old.bristol_types then
    new.bristol_types := case when new.bristol_type is null then '{}'::smallint[] else array[new.bristol_type] end;
  elsif cardinality(new.bristol_types) = 0 and new.bristol_type is not null then
    new.bristol_types := array[new.bristol_type];
  end if;
  new.bristol_types := coalesce(
    (select array_agg(distinct t order by t) from unnest(new.bristol_types) as t),
    '{}'::smallint[]
  );
  new.bristol_type := new.bristol_types[1];
  return new;
end;
$$;

create trigger logs_sync_bristol_types
  before insert or update of bristol_type, bristol_types on public.logs
  for each row execute function public.logs_sync_bristol_types();
