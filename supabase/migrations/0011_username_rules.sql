-- Usernames become user-editable (Profile & account), so they need a format
-- rule: 3–30 characters of lowercase letters, numbers and underscores. The
-- lowercase-only rule also makes the existing unique index case-insensitive in
-- effect, and keeps /u/<username> links clean.
--
-- The sign-up trigger built usernames straight from the email's local part, so
-- an address like John.Doe+x@… would now fail the rule. It now keeps only the
-- allowed characters (up to 20) before the _<8 id chars> suffix.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  base text := left(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), 20);
begin
  if base = '' then
    base := 'user';
  end if;
  insert into public.profiles (id, username)
  values (new.id, base || '_' || substr(new.id::text, 1, 8))
  on conflict (id) do nothing;
  return new;
end
$$;

alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$');
