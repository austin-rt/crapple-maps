-- Random handles are two words: adjective_animal (e.g. swift_otter).
-- Unconfirmed handles are re-rolled in this format.
create or replace function public.random_handle()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  adjectives text[] := array['swift','brave','calm','clever','cosmic','crisp','daring','dizzy','eager','fuzzy',
    'gentle','golden','happy','jolly','lucky','mellow','mighty','misty','nimble','noble','plucky','quiet','rapid',
    'rosy','rusty','sly','snappy','sunny','tidy','witty','zesty','breezy','chill','frosty','peppy','sleepy',
    'bold','bright','bubbly','cheery','cozy','curly','dapper','fancy','feisty','fluffy','frisky','gleeful','grand',
    'hearty','humble','jazzy','keen','lively','loyal','merry','modest','perky','polite','proud','quirky','shiny',
    'silly','sparky','spry','stellar','sturdy','sweet','tiny','upbeat','vivid','wild','wise','zany','spicy','sassy'];
  nouns text[] := array['otter','falcon','badger','heron','lynx','panda','koala','gecko','walrus','moose','raven',
    'yak','bison','crane','dingo','ferret','finch','ibex','lemur','marmot','newt','ocelot','puffin','quokka',
    'robin','seal','tapir','toucan','vole','wombat','zebra','alpaca','beaver','cobra','egret','hare','bear','bee',
    'camel','cat','deer','dolphin','duck','eagle','fox','frog','goat','goose','hawk','hippo','horse','jaguar',
    'kiwi','llama','mole','mouse','narwhal','owl','parrot','pelican','penguin','pig','pony','rabbit','sloth',
    'squid','stork','swan','tiger','turtle','whale','wolf','orca','mink','crow','lark'];
  candidate text;
begin
  loop
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int] || '_' ||
                 nouns[1 + floor(random() * array_length(nouns, 1))::int];
    exit when not exists (select 1 from public.profiles where username = candidate);
  end loop;
  return candidate;
end
$$;

update public.profiles set username = public.random_handle() where username_chosen = false;
