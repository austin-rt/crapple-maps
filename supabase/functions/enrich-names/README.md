# enrich-names

Backfills real restroom titles (business names → street addresses) into the DB,
staying inside Google's free tier. Runtime app makes **zero** geocoding calls
once this has run — names come straight from Postgres.

## Why cron instead of real-time

| | one-time / capped cron | real-time (per pin view) |
|---|---|---|
| API calls | ~150/day, self-limiting | scales with usage |
| Cost | $0 (under free tier) | $32 / 1,000 past 5k/mo |
| Speed | instant (DB read) | waits on Google per view |

Free tiers: **Places Nearby Search** $32/1k, **5,000 free/mo**; **Geocoding**
$5/1k, **10,000 free/mo**. `ENRICH_BATCH=150` → ~4,500 Places calls/mo, safely
under 5k. The ~3,000-row backlog clears in ~3 weeks, then it just handles new
rows.

## Provenance (never clobber humans)

`restrooms.name_source`: `user` > `places` > `osm`/`refuge` > `geocoded`.
The function skips `name_source='user'` and any row with `enriched_at` set.
All names (user edits + cron) pass through `normalize_name()`.

## Deploy (at launch — not before)

```sh
# 1. schema
supabase db push            # applies 0002_name_enrichment.sql

# 2. a SEPARATE server-side Google key — do NOT reuse the iOS client key.
#    Enable "Places API (New)" + "Geocoding API"; restrict by IP or leave
#    unrestricted server-side. (The iOS key is/should be locked to the app
#    bundle and won't work for these web-service calls.)
supabase secrets set GOOGLE_SERVER_KEY=AIza... ENRICH_SECRET=$(openssl rand -hex 16)

# 3. function
supabase functions deploy enrich-names --no-verify-jwt

# 4. one manual run to sanity-check (returns {processed, named, addressed, kept})
curl -s -X POST https://<ref>.functions.supabase.co/enrich-names \
  -H "x-cron-secret: <ENRICH_SECRET>"

# 5. schedule it
#    put ENRICH_SECRET in Vault, then run cron.sql
```

## Tuning

- `ENRICH_BATCH` (env) — rows per run. Keep `BATCH * 30 < 5000`.
- Prefer street addresses only (skip Places, all-free): delete the `nearbyName`
  branch and go straight to `streetAddress` (Geocoding, 10k free/mo).
