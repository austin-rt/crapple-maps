# Crapple Maps — Planning Doc

> Living design doc. Decisions get logged here. (Recovered after a local wipe; the DB schema is live in Supabase and in `supabase/migrations/0001_init.sql`.)

## Vision

Native-first mobile app combining two ideas:
- **Flush** — find nearby public restrooms, with access info/codes.
- **Places I've Pooped** — personal, crude-humor log of where you've pooped.

Public restroom database (utility, for everyone) + private social poop log (fun, for you and friends).

## Constraints (the philosophy)

- **Free to the developer** — nothing that bills per-user or punishes scale; design for portability so free tiers can't trap us.
- **Never paywall users** — 100% free to everyone, forever. No premium tier, no ads-for-features.
- **App store fees acceptable** — $99/yr Apple + $25 Google are fixed dev costs, fine.
- **Native-first** — real iOS + Android app. Web optional/later.
- **Follow established social patterns** — copy Instagram / TikTok / Facebook / Twitter for flows + navigation (bottom tabs, pull-to-refresh, tap-avatar-for-profile, standard compose/upload sheets). Only the subject matter is novel.
- **Free-first, then hand-rolled** — prefer a free service/package; if none, hand-roll rather than pay (e.g. on-device NSFW gate vs paid moderation API).
- **Favor optimization / philosophically sound** — joke app, built seriously. All lists lazy-load (cursor pagination + infinite scroll). No loading everything at once, no needless re-renders, no N+1.

## Stack

| Need | Choice | Why |
|---|---|---|
| App | **Expo (React Native, TypeScript)** — pinned to **SDK 54** | SDK 54 is the newest the App Store Expo Go supports (57 was too new → wouldn't load on device). |
| Navigation | **Expo Router** (file-based, tabs template) | Official template includes it + TS. |
| Components | **React Native Paper** | Batteries-included, drop-in, themed to our palette. |
| Styling | **NativeWind** for custom bits | Tailwind-like utilities. |
| Data/state | **TanStack Query** | Caching, pagination. |
| Forms | **react-hook-form + zod** | Validation. |
| Backend | **Supabase** | Postgres + PostGIS + Auth + Storage + RLS, one free tier; portable (`pg_dump` and leave). |
| Map | **react-native-maps** (Apple Maps iOS / Google Android) | Native SDKs free, no per-load billing. Needs a dev build (not in Expo Go → placeholder in Expo Go). |
| Seed data | **OpenStreetMap** (Overpass) + **Refuge Restrooms** | Free, populated DB day one. |
| Fuzzy tag match | **pg_trgm** | Type-ahead dedup, native to Supabase. |
| Photo escape hatch | **Cloudflare R2** (later) | Zero egress + free tier if Supabase storage bites. |
| Observability | **Sentry** + **PostHog** (free) | Crashes + analytics. |

## Governing data-model rule

On both `restrooms` and `logs`, the **only required field is location**. Everything else optional. Restroom optional fields skew **utility**; log optional fields skew **humor**.

## Tables (see `supabase/migrations/0001_init.sql` for exact DDL + RLS)

- **profiles** (1:1 auth.users) — username, display_name, avatar, bio, settings (default_screen, show_log_photos, notif_prefs), is_admin, denormalized counts. Auto-created on signup via `handle_new_user` trigger.
- **restrooms** — wiki-style. **Only location required** (address OR lat/lng; system backfills). Optional utility fields drawn from OSM/Refuge: name, directions, access_type, fee, hours, operator, level, indoor, accessible, unisex, changing_table, description, last_verified, status, source, merged_into. PostGIS `geog`.
- **restroom_edits** — wiki edit history (last-write-wins + revert).
- **merge_requests** — user-reported duplicate restrooms → admin merge.
- **codes** — belongs to restroom. code + posted_by + posted_at. Store all rows; UI shows recent 5 with "confirmed as of" dates.
- **reviews** — public, about the place. overall_rating + sub_ratings (jsonb, no auto-weighting) + description + photos. ≥1 meaningful field.
- **logs** — humor-first poop log. **Only location required.** Optional: rating, bristol_type (1–7), caption, relief, effort, cleanup, photo (opt-in). visibility friends/private (per-log override).
- **tags** + **restroom_tags**/**log_tags** — shared vocabulary; pg_trgm dedup; normalized_key, usage_count, merged_into.
- **votes** — polymorphic (codes + reviews), one per user per target.
- **follows** — private-account request→approve; directional; "follow back" = mutual.
- **comments** (on logs, single-level replies) + **reactions** (one per user per log).
- **photos** — own table; visibility + moderation per photo. Log photos hidden by default.
- **reports** + **blocks** — moderation.
- **notifications** + **device_tokens** — push + in-app inbox.

## Privacy model

- **Poop info = private or friends-only.** Poop map friends-only by default, or private. No public tier. Per-log override.
- **Restroom info = public.** Reviews, codes, facts are utility for everyone.
- Clean split: **map = private/friends, place info = public.** Enforced at DB via RLS (`can_see_log` / `is_approved_follower` helpers).

## Social

- **Follows:** private-account request→approve (like private Instagram).
- **Feed:** **logs from people you follow. Nothing else.** Chronological. Respects log visibility. React + comment.

## The signature interaction

Single **"I pooped here"** compose flow: rate the place (review) and/or log the poop — **at least one part required**; within a log, location alone is enough.

## Screens (bottom tabs: Map · Feed · [+] · My Map · Profile; default configurable)

- **Map** — native map, clustered restroom pins by access_type, search + filter chips, tap→detail, add-here FAB. Browsable w/o account.
- **Compose ("I pooped here")** — auto-location; optional rate-place + log-poop sections; visibility control.
- **Restroom detail** — access badge, avg rating, codes (recent 5 + confirm votes), amenities (wiki-editable), reviews, photos, actions.
- **Feed** — friends' logs, chronological, pull-to-refresh, infinite scroll.
- **Poop Map** — your pins + heatmap toggle; stats (total, places, streak, countries); badges; yearly Wrapped.
- **Profile** — avatar, bio, counts; follow/unfollow; poop map only to approved followers.
- **Notifications inbox** — grouped, actionable follow requests.
- **Settings** — default screen, log-photo opt-in, notif prefs, blocked users, account (delete/export), legal.

## Technical design

- **API boundary:** app uses supabase-js directly for user-permitted CRUD (RLS-gated). Edge Functions only for privileged/secret ops (moderation gate, push dispatch, seed pipeline, delete/export, merge, crons).
- **Photo pipeline:** device resize ~1080px + compress + **strip EXIF** → direct upload → edge function thumbnail + **moderation gate** (pending→approved). Photos only, no video. Supabase CDN now; R2 later.
- **Image moderation (free):** on-device NSFW classifier + report/block system; no paid API.
- **RLS:** public read for utility (incl. anon); logs gated by `can_see_log`; follows visible to the two parties; photos/comments inherit parent log visibility.
- **Geospatial:** PostGIS `geog` + GiST; near-me `ST_DWithin`; viewport bbox; clustering client-side (supercluster) then server grid clustering at scale.
- **Notifications:** Expo Push + in-app inbox + badge; per-type × per-channel prefs; grouped ("X and 3 others").
- **Seed pipeline:** Overpass (OSM `amenity=toilets`) + Refuge API → spatial+name dedup → load; ODbL attribution.
- **Geocoding:** device geocoder, Nominatim fallback.
- **Offline:** expo-sqlite cache of nearby restrooms + own logs; TanStack Query persistence; optimistic writes.
- **Auth:** Supabase (email + Sign in with Apple + Google); browse anon, login to contribute; auto-confirm on for POC.
- **Aggregates:** counts via Postgres triggers.
- **Search:** Postgres full-text + tag/structured filters + open-now.
- **Builds/release:** EAS Build + Update + Submit; dev/preview/prod profiles.
- **Legal:** privacy policy + EULA (zero-tolerance UGC), GDPR/CCPA (precise location), age rating likely 17+, OSM ODbL attribution.
- **Moderation baseline (build once):** report button, block user, EULA, reported content auto-hides.

## Poop map + gamification

Personal pins + heatmap; stats (total, places, cities/states/countries "conquered", streaks); badges; yearly Wrapped; optional friends leaderboard (off by default).

## Name / branding

- **One name everywhere: "Crapple Maps."** Phonetic wordplay on Apple Maps (not disparagement). App-store trademark-rejection risk accepted.
- **Fallback plan:** if Apple rejects, swap store display name to **"Public Restroom Tracker"** (metadata-only, bundle ID unchanged), resubmit.
- **App icon:** placeholder was `images/crapple-maps-mock-icon.png`. Iterate later.
- **Palette (light):** poop `#6B4423`, porcelain `#F5F3EF`, teal `#2EC4B6`, gold `#FFC24B`, danger `#E05252`. Dark: bg `#1A1614`, surface `#262019`. Pins by access_type: public=green, code=amber, ask_staff=red, customers=blue; log pins=brown.
- **Tone:** punny, PG-13, never mean. Bristol scale illustrated 1–7.

## Prior art & reuse

License rule: reuse **MIT** freely; only *consume data/APIs* from **AGPL/GPL** (never copy their code).
- **Restroom data:** Refuge Restrooms (AGPL — API + data only) + OSM Overpass.
- **Poop-log half:** [Poopd](https://github.com/larshaga/Poopd) (MIT) — feature/UX reference.
- **Scaffold:** official `create-expo-app` router+TS template.

## Provisioning (accounts/keys → `.env`, kept)

Supabase (project `obxrsxrtqkegwmzxbkdc`, schema live, 120 restrooms seeded), Expo/EAS (token), Sentry (DSN), PostHog (key), GitHub (token). Tokens named "claude" where possible. Remaining human-only: Google Cloud Maps key (billing), Apple Developer $99, Google Play $25.

## Hard-won lesson (the device saga)

The app wouldn't load in Expo Go for a long time. Root cause: **`create-expo-app@latest` scaffolds Expo SDK 57**, but the **App Store Expo Go only supports up to SDK 54** (newer Expo Go builds aren't live on the iOS App Store yet). Fix: **pin the project to SDK 54.** Also: the SDK 57 template enabled `experiments.reactCompiler` without the plugin installed — remove it. Network/tunnel were never the problem.

## Still to design / next

- Restore SETUP.md.
- Screen-level detailed wireframes + microcopy.
- Edge-function contracts (moderation, push, seed, delete/export, merge).
