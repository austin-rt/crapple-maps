-- Applied 2026-08-13 (remote: age_gate). Recorded here; already live.
--
-- COPPA gate for the social surface. The app collects email, precise location,
-- photos and bowel-health entries; collecting those from under-13s without
-- verifiable parental consent is FTC territory. Restroom search stays open to
-- everyone — only account-bound social features check this.
--
-- Stores the verification, NOT the date of birth: the birthday itself is
-- personal data we have no other use for, so we don't keep it.
alter table public.profiles
  add column if not exists age_verified_at timestamptz;

comment on column public.profiles.age_verified_at is
  'Set when the user self-attests to being 13+. Null = not yet gated. DOB is deliberately not stored.';
