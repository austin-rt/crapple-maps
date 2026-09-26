-- Profile photos overwrite in place (<uid>/avatar.jpg) and are removed when a
-- user shuffles back to a drawn avatar, so owners need to delete files in their
-- own avatars folder. Old per-upload files are cleaned up the same way.
create policy avatars_delete on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
