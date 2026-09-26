-- Storage buckets and policies production got from the dashboard, recorded so
-- a fresh project (dev) matches. Guarded, so a no-op on production.
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('log-photos', 'log-photos', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'avatars_read') then
    create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'avatars_write') then
    create policy avatars_write on storage.objects for insert
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'avatars_update') then
    create policy avatars_update on storage.objects for update
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'log_photos_read') then
    create policy log_photos_read on storage.objects for select using (bucket_id = 'log-photos');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'log_photos_insert') then
    create policy log_photos_insert on storage.objects for insert
      with check (bucket_id = 'log-photos' and (storage.foldername(name))[1] = (auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'log_photos_delete') then
    create policy log_photos_delete on storage.objects for delete
      using (bucket_id = 'log-photos' and (storage.foldername(name))[1] = (auth.uid())::text);
  end if;
end
$$;
