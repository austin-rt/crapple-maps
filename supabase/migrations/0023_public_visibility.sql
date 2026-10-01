-- Separate from 0024: a new enum value can't be used in the transaction that adds it.
alter type public.log_visibility add value if not exists 'public';
