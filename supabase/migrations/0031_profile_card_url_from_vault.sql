-- The profile-card trigger had production's function URL written into it, so
-- local and preview databases called production. The URL now comes from Vault
-- like the secret does; a project without both sends nothing:
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/profile-card', 'profile_card_url');
create or replace function public.request_profile_card()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fn_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'profile_card_url');
  fn_secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'profile_card_secret');
begin
  if fn_url is not null and fn_secret is not null then
    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-card-secret', fn_secret),
      body    := jsonb_build_object('user_id', new.id)
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.request_profile_card() from public, anon, authenticated;
