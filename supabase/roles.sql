-- Runs before migrations on the local stack only (supabase start / db reset).
-- Production and preview were created when Supabase still granted API roles
-- table access by default; newer local images don't. Restoring that default
-- here makes local grants match theirs, so migrations that narrow access
-- (revoke ... on notifications) behave the same everywhere.
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
