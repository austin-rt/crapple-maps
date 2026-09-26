-- Random handles are words only (adjective_color_animal, e.g. swift_teal_otter),
-- no digits. Unconfirmed handles from 0015 are re-rolled in the new format.
create or replace function public.random_handle()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  adjectives text[] := array['swift','brave','calm','clever','cosmic','crisp','daring','dizzy','eager','fuzzy',
    'gentle','golden','happy','jolly','lucky','mellow','mighty','misty','nimble','noble','plucky','quiet','rapid',
    'rosy','rusty','sly','snappy','sunny','tidy','witty','zesty','breezy','chill','frosty','peppy','sleepy'];
  colors text[] := array['amber','azure','coral','crimson','ivory','jade','lilac','lime','mint','navy','ochre',
    'olive','peach','plum','ruby','sage','scarlet','silver','teal','violet'];
  nouns text[] := array['otter','falcon','badger','heron','lynx','panda','koala','gecko','walrus','moose','raven',
    'yak','bison','crane','dingo','ferret','finch','ibex','lemur','marmot','newt','ocelot','puffin','quokka',
    'robin','seal','tapir','toucan','vole','wombat','zebra','alpaca','beaver','cobra','egret','hare'];
  candidate text;
  tries int := 0;
begin
  loop
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int] || '_' ||
                 colors[1 + floor(random() * array_length(colors, 1))::int] || '_' ||
                 nouns[1 + floor(random() * array_length(nouns, 1))::int];
    tries := tries + 1;
    if tries > 50 then
      candidate := candidate || '_' || nouns[1 + floor(random() * array_length(nouns, 1))::int];
    end if;
    exit when not exists (select 1 from public.profiles where username = candidate);
  end loop;
  return candidate;
end
$$;

update public.profiles set username = public.random_handle() where username_chosen = false;
