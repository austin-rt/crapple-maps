-- Self-serve account deletion (App Store 5.1.1). Deleting the auth.users row
-- cascades: profiles (id FK) → logs/comments/reactions/reviews/follows/saves/
-- blocks (user_id FKs); restrooms.added_by and photos.uploaded_by go NULL so
-- community data survives anonymized. Storage objects are purged client-side
-- first — Postgres rejects direct deletes from storage.objects (error 42501).
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
