# Database environments: local, preview, production

**Rule: a schema change runs locally, then on preview, then on production.
Nothing is tried on production first.**

| tier | database | used by |
|------|----------|---------|
| LOCAL | Supabase CLI stack in Docker (`supabase start`) | `expo start` via `.env.development.local` (gitignored) |
| PREVIEW | `ymgprjcjgoybnngbgfki` "Crapple Maps Dev" | `develop`: preview builds (EAS profile `preview`, EAS env `preview`), preview OTAs, preview.crapplemaps.com (Vercel Preview env) |
| PROD | `obxrsxrtqkegwmzxbkdc` "Crapple Maps" | `main`: App Store / Play builds, production OTAs, crapplemaps.com (Vercel Production env), EAS env `production`, `.env`, the Supabase MCP server |

Real users only exist on production. Preview and local hold demo/test
accounts (`kind` = `demo` / `test`, migration 0020).

## Migrations

`supabase/migrations/NNNN_name.sql`, numbered in order with no repeats (the
CLI keys its history table on the number). Write the file, then:

1. **Local:** `supabase migration up` (or `supabase db reset` to replay all).
2. **Preview:** push to `develop`. `.github/workflows/db-migrations.yml` runs
   `supabase db push` against preview (`PREVIEW_DB_URL` secret).
3. **Production:** merge to `main`; the same workflow pushes to production
   (`PROD_DB_URL` secret).

`db push` applies only versions missing from the target's
`supabase_migrations.schema_migrations`. Both remotes were aligned to
0001–0029 on 2026-10-01 with `supabase migration repair`; anything applied by
hand (MCP, dashboard) must be recorded the same way or CI will try it again.

`0005_x_schema_drift.sql` and `0021_x_storage_drift.sql` capture what
production got outside migrations (columns, legacy RPCs, pg_net, feedback
table, storage buckets/policies). They are guarded no-ops on production.

## Local stack

    supabase start                  # first run pulls images; applies every migration
    supabase/dev/load_local.sh      # restrooms from preview + demo accounts, feed, engagement
    TMPDIR=$HOME/.cache/supabase-tmp supabase functions serve   # Edge Functions (push)
    supabase db reset               # wipe and replay migrations; rerun load_local.sh after

- Colima can't mount macOS's temp dir, so `functions serve` needs the TMPDIR
  above, and analytics is off in `config.toml`.
- `supabase/roles.sql` gives the API roles the same default table grants the
  hosted projects have; newer local images grant nothing by default.
- `load_local.sh` needs the preview DB password in `.secrets/dev-db-password`.
- Demo login `demo@cm.seed` / `demopass1`. The iOS simulator reaches the stack
  at 127.0.0.1; an Android emulator needs 10.0.2.2 in `.env.development.local`.
- To run `expo start` against preview instead, copy `.secrets/preview.env` over
  `.env.development.local`. It lives in `.secrets/` because Metro tries to
  parse extra `.env*` files in the project root.

## Edge Functions and Vault

Triggers read their target URL and shared secret from each project's Vault,
so a database only ever calls its own functions:

| trigger | Vault names | function secret |
|---------|-------------|-----------------|
| `notifications_push` (0030) | `push_function_url`, `push_secret` | `PUSH_SECRET` on `push` |
| profile cards (0031) | `profile_card_url`, `profile_card_secret` | `CARD_SECRET` on `profile-card` |

Preview and production each have both functions with their own secrets.
Locally, `load_local.sh` sets up push only, so profile cards don't render.
Deploy a function to a project with
`supabase functions deploy <name> --project-ref <ref> --use-api`
(`push` also takes `--no-verify-jwt`).

## Push notifications

Each new notifications row triggers `push`, which sends an Expo push to every
token in `push_tokens` for the recipient and drops tokens Expo reports as
unregistered. Apple delivery needs the APNs key stored on EAS
(`eas credentials -p ios`); Android needs an FCM key and is not set up.
