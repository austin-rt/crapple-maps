-- Daily schedule for the enrich-names Edge Function.
-- RUN AT LAUNCH ONLY — needs pg_cron + pg_net, the function deployed, and
-- secrets set. Pre-launch: leave unscheduled (runtime geocoding covers titles).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Store the function's shared secret in Vault once:
--   select vault.create_secret('<ENRICH_SECRET value>', 'enrich_secret');

select cron.schedule(
  'enrich-names-daily',
  '30 9 * * *',                                   -- 09:30 UTC daily, ~150 rows/run
  $$
  select net.http_post(
    url     := 'https://obxrsxrtqkegwmzxbkdc.functions.supabase.co/enrich-names',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'enrich_secret')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Stop:   select cron.unschedule('enrich-names-daily');
-- Watch:  select * from cron.job_run_details order by start_time desc limit 10;
