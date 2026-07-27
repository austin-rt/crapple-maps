# Database environments (dev vs prod)

**Rule: never develop against the production database.** The project we build on
holds test users, seeded logs, and throwaway data — that must never be what ships.

## Current state

- **DEV / staging** = Supabase project `obxrsxrtqkegwmzxbkdc` (the one in `.env`).
  All local/dev-build work points here. Test data lives here and is disposable.
- **PROD** = does **not exist yet**. Created clean at launch (runbook below).

The app reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`, so
which DB it uses is purely an env switch:

- Dev builds → `.env` (dev project).
- Production build → prod project creds, injected via the EAS `production` build
  profile (env / secrets), or a `.env.production`. **Prod creds never go in the
  dev `.env`.**

## Options for isolation

1. **Two projects (free, chosen)** — dev project (current) + a fresh prod project
   made at launch. Zero cost, clean separation. Free tier allows 2 projects/org.
2. **Supabase Branching (Pro, ~$25/mo)** — the Neon-style per-Git-branch preview
   databases with a protected `production` branch. Upgrade to this if we want
   automatic branch DBs; not needed pre-launch.

## Launch runbook (create clean prod)

1. Create a new Supabase project → this is PROD. Save its URL + anon key + a
   strong DB password + service_role key.
2. Apply schema: `supabase link --project-ref <PROD_REF>` then
   `supabase db push` (runs `migrations/0001…`, `0002…`, and any later ones).
3. Seed **real** restroom data only (Refuge + OSM) — no test users/logs.
4. Run the name-enrichment cron against prod (see `functions/enrich-names`).
5. Put prod URL/anon key in the EAS `production` profile env (NOT `.env`).
6. Build with `--profile production` and submit. Dev keeps using the dev project.
7. Before/at launch: wipe or archive the dev project's test users/logs.

## Guardrails

- Test users use fake names only (they get nuked before launch).
- Don't hardcode the dev project ref in app code — always via env.
- The `test`/`test` dev-login shim in `profile.tsx` must be removed for the
  production build.
