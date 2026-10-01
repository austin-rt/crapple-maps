-- In-app activity: new followers, follow requests and accepts, likes and
-- comments. Rows are written only by the triggers below; a recipient can read
-- their own rows and set read_at, nothing else.
-- Replaces the unused, empty notifications table from 0001_init.
drop table if exists public.notifications;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('follow', 'follow_request', 'follow_accepted', 'like', 'comment')),
  log_id uuid references public.logs(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_recipient_created on public.notifications (recipient_id, created_at desc);
create index notifications_recipient_unread on public.notifications (recipient_id) where read_at is null;
-- One row per person per follow event and per post like, so re-following or
-- re-liking bumps the existing row instead of stacking duplicates.
create unique index notifications_follow_once on public.notifications (recipient_id, actor_id, kind)
  where kind in ('follow', 'follow_request', 'follow_accepted');
create unique index notifications_like_once on public.notifications (recipient_id, actor_id, log_id)
  where kind = 'like';

alter table public.notifications enable row level security;
create policy read_own on public.notifications for select using (recipient_id = auth.uid());
create policy mark_read on public.notifications for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify_follow_event(p_recipient uuid, p_actor uuid, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, actor_id, kind)
  select p_recipient, p_actor, p_kind
  where p_recipient <> p_actor
  on conflict (recipient_id, actor_id, kind) where kind in ('follow', 'follow_request', 'follow_accepted')
  do update set created_at = now(), read_at = null;
$$;

revoke all on function public.notify_follow_event(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.follows_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.notifications
     where kind = 'follow_request' and recipient_id = old.followee_id and actor_id = old.follower_id;
    return old;
  end if;

  if tg_op = 'INSERT' then
    perform public.notify_follow_event(
      new.followee_id, new.follower_id,
      case when new.status = 'approved' then 'follow' else 'follow_request' end);
  elsif old.status = 'pending' and new.status = 'approved' then
    delete from public.notifications
     where kind = 'follow_request' and recipient_id = new.followee_id and actor_id = new.follower_id;
    perform public.notify_follow_event(new.followee_id, new.follower_id, 'follow');
    perform public.notify_follow_event(new.follower_id, new.followee_id, 'follow_accepted');
  end if;
  return new;
end;
$$;

create trigger follows_notify
  after insert or update of status or delete on public.follows
  for each row execute function public.follows_notify();

create or replace function public.reactions_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  if tg_op = 'DELETE' then
    delete from public.notifications
     where kind = 'like' and actor_id = old.user_id and log_id = old.log_id;
    return old;
  end if;

  select l.user_id into owner from public.logs l where l.id = new.log_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, kind, log_id)
    values (owner, new.user_id, 'like', new.log_id)
    on conflict (recipient_id, actor_id, log_id) where kind = 'like'
    do update set created_at = now(), read_at = null;
  end if;
  return new;
end;
$$;

create trigger reactions_notify
  after insert or delete on public.reactions
  for each row execute function public.reactions_notify();

create or replace function public.comments_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
  parent_author uuid;
begin
  select l.user_id into owner from public.logs l where l.id = new.log_id;
  if new.parent_id is not null then
    select c.user_id into parent_author from public.comments c where c.id = new.parent_id;
  end if;

  insert into public.notifications (recipient_id, actor_id, kind, log_id, comment_id)
  select distinct r, new.user_id, 'comment', new.log_id, new.id
  from unnest(array[owner, parent_author]) as r
  where r is not null and r <> new.user_id;
  return new;
end;
$$;

create trigger comments_notify
  after insert on public.comments
  for each row execute function public.comments_notify();

-- The last 30 days, so people who already gained followers or likes see them.
insert into public.notifications (recipient_id, actor_id, kind, created_at)
select f.followee_id, f.follower_id,
       case when f.status = 'approved' then 'follow' else 'follow_request' end,
       f.created_at
from public.follows f
where f.created_at > now() - interval '30 days' and f.follower_id <> f.followee_id
on conflict do nothing;

insert into public.notifications (recipient_id, actor_id, kind, log_id, created_at)
select distinct on (l.user_id, r.user_id, r.log_id) l.user_id, r.user_id, 'like', r.log_id, r.created_at
from public.reactions r
join public.logs l on l.id = r.log_id
where r.created_at > now() - interval '30 days' and r.user_id <> l.user_id
order by l.user_id, r.user_id, r.log_id, r.created_at desc
on conflict do nothing;

insert into public.notifications (recipient_id, actor_id, kind, log_id, comment_id, created_at)
select l.user_id, c.user_id, 'comment', c.log_id, c.id, c.created_at
from public.comments c
join public.logs l on l.id = c.log_id
where c.created_at > now() - interval '30 days' and c.deleted_at is null and c.user_id <> l.user_id;
