-- The poster marks a log's photos as graphic; the app shows them blurred until
-- the viewer taps to see them.
alter table public.logs add column graphic boolean not null default false;
