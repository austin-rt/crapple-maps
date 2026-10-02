-- Likes on comments. Anyone who can read a comment can like it; its author gets
-- one notification per liker (re-liking bumps it), and unliking removes it.
-- A surrogate key like reactions has, not a (comment_id, user_id) primary key:
-- PostgREST reads a table whose primary key is two foreign keys as a link
-- table, which makes every comments→profiles embed ambiguous (PGRST201).
create table public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
create index comment_likes_user on public.comment_likes (user_id);

-- The comments read policy applies inside these subqueries, so a like is
-- visible, and can be added, only where the comment itself is.
alter table public.comment_likes enable row level security;
create policy read_via_comment on public.comment_likes for select
  using (exists (select 1 from public.comments c where c.id = comment_likes.comment_id));
create policy insert_own on public.comment_likes for insert
  with check (auth.uid() = user_id and exists (select 1 from public.comments c where c.id = comment_likes.comment_id));
create policy delete_own on public.comment_likes for delete using (auth.uid() = user_id);

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('follow', 'follow_request', 'follow_accepted', 'like', 'comment', 'comment_like'));
create unique index notifications_comment_like_once on public.notifications (recipient_id, actor_id, comment_id)
  where kind = 'comment_like';

create or replace function public.comment_likes_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author uuid;
  post uuid;
begin
  if tg_op = 'DELETE' then
    delete from public.notifications
     where kind = 'comment_like' and actor_id = old.user_id and comment_id = old.comment_id;
    return old;
  end if;

  select c.user_id, c.log_id into author, post from public.comments c where c.id = new.comment_id;
  if author is not null and author <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, kind, log_id, comment_id)
    values (author, new.user_id, 'comment_like', post, new.comment_id)
    on conflict (recipient_id, actor_id, comment_id) where kind = 'comment_like'
    do update set created_at = now(), read_at = null;
  end if;
  return new;
end;
$$;

revoke execute on function public.comment_likes_notify() from public, anon, authenticated;

create trigger comment_likes_notify
  after insert or delete on public.comment_likes
  for each row execute function public.comment_likes_notify();
