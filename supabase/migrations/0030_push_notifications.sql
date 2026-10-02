-- Expo push tokens, one row per account per device. The app adds its row after
-- sign-in and deletes it on sign-out, so a shared device stops getting the
-- previous account's alerts.
create table public.push_tokens (
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);
alter table public.push_tokens enable row level security;
create policy own_tokens on public.push_tokens for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Each new notification asks the push Edge Function to deliver it. The URL and
-- shared secret are per project in Vault, so a project without them (local, or
-- one not set up yet) sends nothing instead of calling another project:
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/push', 'push_function_url');
--   select vault.create_secret('<PUSH_SECRET>', 'push_secret');
create or replace function public.request_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fn_url text := (select decrypted_secret from vault.decrypted_secrets where name = 'push_function_url');
  fn_secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'push_secret');
begin
  if fn_url is not null and fn_secret is not null then
    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', fn_secret),
      body    := jsonb_build_object('notification_id', new.id)
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.request_push() from public, anon, authenticated;

create trigger notifications_push
  after insert on public.notifications
  for each row execute function public.request_push();
