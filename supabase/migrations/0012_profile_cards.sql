-- Profile share cards: a pre-rendered 1200x630 PNG per user at
-- profile-cards/<user_id>.png, used as the og:image for crapplemaps.com/u/<username>.
-- Rendered by the profile-card Edge Function only when something on the card
-- changes (photo, seeded avatar, display name, username), never per view.
--
-- Needs the shared secret in Vault (same value as the function's CARD_SECRET):
--   select vault.create_secret('<CARD_SECRET>', 'profile_card_secret');

insert into storage.buckets (id, name, public)
values ('profile-cards', 'profile-cards', true)
on conflict (id) do nothing;

create or replace function public.request_profile_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url     := 'https://obxrsxrtqkegwmzxbkdc.supabase.co/functions/v1/profile-card',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-card-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'profile_card_secret')
    ),
    body    := jsonb_build_object('user_id', new.id)
  );
  return new;
end;
$$;

revoke execute on function public.request_profile_card() from public, anon, authenticated;

create trigger profile_card_on_insert
after insert on public.profiles
for each row execute function public.request_profile_card();

create trigger profile_card_on_update
after update of avatar_url, avatar_seed, display_name, username on public.profiles
for each row
when (
  old.avatar_url is distinct from new.avatar_url
  or old.avatar_seed is distinct from new.avatar_seed
  or old.display_name is distinct from new.display_name
  or old.username is distinct from new.username
)
execute function public.request_profile_card();
