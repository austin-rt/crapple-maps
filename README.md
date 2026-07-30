# Crapple Maps

Find a bathroom, fast. A community-built map of public restrooms — with the
details that matter when you're in a hurry: whether it's public or
customers-only, whether you need a door code, and how to actually find the
thing once you're inside the building.

One Expo codebase ships iOS, Android, and the web app at
[crapplemaps.com](https://crapplemaps.com).

## Stack

| | |
|---|---|
| App | Expo SDK 54, expo-router, React Native + react-native-web |
| Styling | NativeWind (Tailwind), CSS-variable theme tokens |
| Backend | Supabase — Postgres + PostGIS, Auth, Storage, RLS |
| Maps | react-native-maps on native, `@vis.gl/react-google-maps` on web |
| Icons | Phosphor, behind a single `Icon` component |
| Web hosting | Vercel (static export) |
| Native builds | EAS Build + EAS Update (OTA) |

## Getting started

```bash
npm install
npx expo start
```

`.env` holds the `EXPO_PUBLIC_*` keys (Supabase URL and anon key, Google Maps
keys) plus `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `EXPO_TOKEN`, and
`GITHUB_TOKEN`. It is gitignored and must stay that way — only the
`EXPO_PUBLIC_*` values are safe to expose, since they are compiled into the
client bundle.

Rotating an `EXPO_PUBLIC_*` value needs a Metro cache clear
(`npx expo start -c`), or the old value keeps shipping.

## Layout

```
app/            expo-router routes; *.web.tsx overrides the native file
  (tabs)/         map, feed, compose, my-map, profile
  restroom/new    add a restroom
  log/[id]        a single post
components/     by feature: finder, restroom, feed, compose, profile, people, ui, web
hooks/          react-query wrappers, one per domain concern
lib/db/         every Supabase query; nothing else touches the client directly
lib/            pure logic: geocode, hours, format, bristol, tokens, theme
supabase/       migrations (the live DB is the source of truth, not 0001)
marketing/      standalone /info, /privacy, /terms, /contact pages
store/          App Store screenshots
```

**Layering:** components → hooks → `lib/db` → Supabase. Pure helpers in `lib/`
know nothing about React or Supabase.

**Platform splits** use expo-router's `.web.tsx` convention. Phone-sized web
deliberately renders the same `MobileMap` as native; only desktop gets its own
layout.

## Theming

Colors live once, in `theme/palette.js`, as RGB triples. A Tailwind plugin emits
them as CSS variables for class names (`bg-surface`, `text-content`), and
`useColors()` resolves the same values for style props that can't take a class.
Change a color there and it updates everywhere — no inline hex, and no
`scheme === 'dark'` checks in components.

## Shipping

See `AGENTS.md` for the full rules. Short version: push to `main` and the
pipeline decides what the change needs — app code gets a web deploy plus an OTA
update, marketing gets web only, and dependency or config changes also build a
native binary and submit it to TestFlight. Don't bump `expo.version` casually;
it forks the OTA runtime and the TestFlight version train.

## Store compliance

Requirements that are easy to regress, so don't remove them casually:

- **Account deletion** (5.1.1) — Profile → Delete account. Storage is purged
  client-side first, because Postgres rejects direct deletes from
  `storage.objects`.
- **Report and block** (1.2) — the ••• menu on any post or comment. Blocked
  users are filtered out of the feed and comment threads at read time.
- **Purpose strings** — specific ones, in `app.json`. The generated defaults
  invite a rejection.
- **App Privacy** — answers documented in `docs/app-privacy.md`. Apple exposes
  no API for the questionnaire, so it is filled in by hand.

## Feedback

[crapplemaps.com/contact](https://crapplemaps.com/contact) posts straight to
Supabase — the anon key is already public in the client, and RLS on `feedback`
allows insert only and blocks reads. A trigger opens an issue in
`austin-rt/crapple-maps-feedback`; the submitter's email is deliberately kept
out of the issue body, so use the row id there to look it up when replying.
`help@crapplemaps.com` forwards via Cloudflare Email Routing.
