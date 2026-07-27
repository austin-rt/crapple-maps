-- ============================================================
-- Name enrichment + normalization
--
-- Restrooms are wiki-style: a name can come from a user, the Places API, the
-- original OSM/Refuge seed, or a reverse-geocoded street address. `name_source`
-- records provenance so the backfill cron never overwrites a human's name, and
-- `enriched_at` marks rows we've already processed (so we don't re-spend API
-- calls). Every write flows through normalize_name() for consistency.
--
-- NOT applied to the live DB until launch. Pre-launch we can drop/recreate at
-- will, so this migration is written plainly.
-- ============================================================

alter table restrooms
  add column if not exists name_source text
    check (name_source in ('user', 'places', 'osm', 'refuge', 'geocoded')),
  add column if not exists enriched_at timestamptz;

-- Trim, collapse internal whitespace, empty -> null. (Fixes seed junk like
-- "Peter Piper Pizza " with a trailing space.)
create or replace function normalize_name(n text) returns text
  language sql immutable as $$
  select nullif(btrim(regexp_replace(coalesce(n, ''), '\s+', ' ', 'g')), '');
$$;

-- Normalize any name written to the table (user edits AND cron writes).
create or replace function restrooms_normalize_name() returns trigger
  language plpgsql as $$
begin
  new.name := normalize_name(new.name);
  return new;
end $$;

drop trigger if exists trg_restrooms_normalize on restrooms;
create trigger trg_restrooms_normalize
  before insert or update of name on restrooms
  for each row execute function restrooms_normalize_name();

-- Fast lookup of rows still needing a real name (used by the enrich cron).
create index if not exists restrooms_needs_name_idx
  on restrooms (enriched_at)
  where enriched_at is null;
