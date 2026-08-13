-- Applied 2026-08-13 (remote: age_eligible_at). Recorded here; already live.
--
-- Replaces 0008's age_verified_at, which recorded the wrong fact. It was only
-- ever written on success, so a rejected under-13 left no trace and could
-- immediately retry with a made-up date, and nothing could be recomputed later.
--
-- Store the moment they turn 13 instead. One column, evaluated fresh on every
-- check: past = eligible, future = blocked until that date and unblocks on its
-- own. Still not the date of birth — this is purpose-bound to the gate.
alter table public.profiles
  add column if not exists age_eligible_at timestamptz;

comment on column public.profiles.age_eligible_at is
  'When the user turns 13, derived from a self-attested DOB that is not itself stored. Past = may use social features; future = blocked until then; null = never asked.';

update public.profiles
   set age_eligible_at = age_verified_at
 where age_verified_at is not null
   and age_eligible_at is null;

alter table public.profiles drop column if exists age_verified_at;
