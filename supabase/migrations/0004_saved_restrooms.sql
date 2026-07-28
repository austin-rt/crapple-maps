-- Saved / bookmarked restrooms (per user). Idempotent + RLS-scoped to the owner.
create table if not exists saved_restrooms (
  user_id     uuid not null references profiles(id) on delete cascade,
  restroom_id uuid not null references restrooms(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, restroom_id)
);

alter table saved_restrooms enable row level security;

drop policy if exists read_own on saved_restrooms;
create policy read_own on saved_restrooms for select using (auth.uid() = user_id);

drop policy if exists insert_own on saved_restrooms;
create policy insert_own on saved_restrooms for insert with check (auth.uid() = user_id);

drop policy if exists delete_own on saved_restrooms;
create policy delete_own on saved_restrooms for delete using (auth.uid() = user_id);
