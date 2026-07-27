# Setup — accounts, keys, MCP

All secrets live in `.env` (gitignored, preserved through the wipe). Provisioned this build:

## Done (values in `.env`)
- **Supabase** (free) — project ref `obxrsxrtqkegwmzxbkdc`. `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Also `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` (server-only, not bundled). Schema + RLS applied; 120 restrooms seeded from OSM.
- **Expo / EAS** — `EXPO_TOKEN` (token name "claude", no expiry). `eas` CLI authenticated.
- **Sentry** — `EXPO_PUBLIC_SENTRY_DSN` (org crapple-maps, React Native project).
- **PostHog** — `EXPO_PUBLIC_POSTHOG_KEY` + `EXPO_PUBLIC_POSTHOG_HOST` (US).
- **GitHub** — `GITHUB_TOKEN` (classic, name "claude", no expiry, repo+workflow). `gh` CLI authenticated.

## MCP
- Supabase MCP was configured in `.mcp.json` (gitignored) using `SUPABASE_ACCESS_TOKEN`. Re-add if desired:
  ```json
  { "mcpServers": { "supabase": { "command": "npx",
    "args": ["-y","@supabase/mcp-server-supabase@latest","--project-ref=obxrsxrtqkegwmzxbkdc"],
    "env": { "SUPABASE_ACCESS_TOKEN": "<from .env>" } } } }
  ```

## Applying the schema (if needed again)
Schema is already live in Supabase. To reapply from the file, run `supabase/migrations/0001_init.sql` via the Supabase SQL editor, the CLI (`supabase db push` after `supabase link`), or the Management API:
`POST https://api.supabase.com/v1/projects/<ref>/database/query` with `{"query": "<sql>"}` and `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`.

## Human-only, still pending (payment/identity — not blocking dev)
- **Google Cloud** Maps SDK for Android key (needs billing) → `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`. iOS uses Apple Maps, no key.
- **Apple Developer** ($99/yr) — iPhone dev builds + Sign in with Apple.
- **Google Play** ($25 once) — Android store.

## Critical build note
Pin the Expo project to **SDK 54** — the iOS App Store Expo Go doesn't support 55/56/57 yet. `create-expo-app@latest` gives 57, which won't load on the phone.
