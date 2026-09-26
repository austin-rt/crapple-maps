# Database environments (dev vs prod)

**Rule: develop against the dev project, never production.**

## Projects

| env  | Supabase project | used by |
|------|------------------|---------|
| PROD | `obxrsxrtqkegwmzxbkdc` "Crapple Maps" | App Store / Play builds, OTA updates, crapplemaps.com (Vercel), EAS env `production`, `.env` |
| DEV  | `ymgprjcjgoybnngbgfki` "Crapple Maps Dev" | local `expo start` via `.env.development.local` (gitignored) |

The original project became production when the app launched on it, so it
also holds seed and test accounts. Every profile carries `kind`
(`real` / `demo` / `test`, migration 0018); real users only find real
accounts in People search. Dev has only demo/test accounts.

## How the app picks a database

The app reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

- `expo start` (development) loads `.env.development.local` over `.env` → DEV.
- `expo export`, EAS builds and `eas update --environment production` never load
  `.env.development.local` → PROD. (Checked: a web export contains only the
  prod host.)

To point local work at prod temporarily, move `.env.development.local` aside.

## Keeping dev's schema in step

Apply migrations to both projects. Prod: Supabase MCP / dashboard. Dev: psql
with the dev DB password (in gitignored `.secrets/dev-db-password`):

    psql "host=aws-0-ca-central-1.pooler.supabase.com port=5432 dbname=postgres \
          user=postgres.ymgprjcjgoybnngbgfki sslmode=require" -f supabase/migrations/NNNN_x.sql

`0004_x_schema_drift.sql` and `0018_x_storage_drift.sql` capture what production
got outside migrations (columns, legacy RPCs, pg_net, feedback table, storage
buckets/policies). They are guarded no-ops on prod. Dev deliberately has no
`feedback_to_github` trigger, so dev feedback never opens GitHub issues.

## Dev data

- Restrooms: all ~97k copied from prod (public columns; `added_by` /
  `merged_into` dropped since those users/rows don't exist in dev).
- Accounts: `supabase/dev/seed_feed.sql` then `seed_engagement.sql` (run the
  latter in one transaction: `psql -1 -f`). Demo login `demo@cm.seed` /
  `demopass1`; test login `test@test.com` / `testtest` (the dev `test`/`test`
  shortcut in AuthForm).
- Seed photos are hosted in prod's public `log-photos` bucket.

Dev's profile-card trigger has no Vault secret, so card rendering is a no-op
there.
