#!/usr/bin/env bash
# Fills the local Supabase stack (`supabase start`) with data to work against:
# every restroom from the preview project, then the demo accounts, feed and
# engagement seeds. Run after `supabase start` or `supabase db reset`.
#
# Needs the preview DB password in .secrets/dev-db-password (gitignored).
set -euo pipefail
cd "$(dirname "$0")/../.."

DB=supabase_db_crapple-maps
PREVIEW="host=aws-0-ca-central-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.ymgprjcjgoybnngbgfki sslmode=require"
# geog and search_tsv are filled by the restrooms triggers.
COLS="id,name,lat,lng,address,city,state,country,directions,access_type,fee,fee_amount,hours,operator,level,indoor,accessible,unisex,changing_table,description,status,last_verified,source,created_at,updated_at,name_source,enriched_at,purchase_required,source_id,requires_code"

local_psql() { docker exec -i "$DB" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

echo "Copying restrooms from preview…"
local_psql -c "truncate public.restrooms cascade"
docker exec -e PGPASSWORD="$(cat .secrets/dev-db-password)" "$DB" \
  psql "$PREVIEW" -At -c "\copy (select $COLS from public.restrooms) to stdout" \
  | local_psql -c "\copy public.restrooms ($COLS) from stdin"
local_psql -At -c "select count(*) || ' restrooms' from public.restrooms"

echo "Seeding demo accounts and feed…"
local_psql -f - < supabase/dev/seed_feed.sql
local_psql -1 -f - < supabase/dev/seed_engagement.sql
local_psql -At -c "select count(*) || ' logs, ' || (select count(*) from public.profiles) || ' profiles' from public.logs"
echo "Pointing push at the local push function…"
# Local-only secret; `supabase functions serve` reads supabase/functions/.env.
LOCAL_PUSH_SECRET=local-push-secret
[ -f supabase/functions/.env ] || echo "PUSH_SECRET=$LOCAL_PUSH_SECRET" > supabase/functions/.env
local_psql -c "delete from vault.secrets where name in ('push_function_url', 'push_secret')"
local_psql -c "select vault.create_secret('http://supabase_kong_crapple-maps:8000/functions/v1/push', 'push_function_url')" >/dev/null
local_psql -c "select vault.create_secret('$LOCAL_PUSH_SECRET', 'push_secret')" >/dev/null

echo "Done. Demo login: demo@cm.seed / demopass1"
