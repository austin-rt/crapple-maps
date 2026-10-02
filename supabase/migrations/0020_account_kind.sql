-- Every account is flagged real, demo or test, since seed and test accounts
-- live in the same project as real users. Real users don't see demo/test
-- accounts in People search. Users can't change their own flag; only the
-- service role / dashboard (no end-user JWT) can.
alter table public.profiles
  add column if not exists kind text not null default 'real' check (kind in ('real', 'demo', 'test'));

update public.profiles p set kind = 'demo'
from auth.users u
where u.id = p.id and (u.email like '%@cm.seed' or u.email = 'demofriend@test.com');

update public.profiles p set kind = 'test'
from auth.users u
where u.id = p.id and u.email in ('test@test.com', 'testuser12345@example.com', 'crawlerrobo@gmail.com');

create or replace function public.profiles_lock_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind is distinct from old.kind and coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.kind := old.kind;
  end if;
  return new;
end
$$;

drop trigger if exists profiles_lock_kind on public.profiles;
create trigger profiles_lock_kind before update on public.profiles
for each row execute function public.profiles_lock_kind();
