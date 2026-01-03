-- Schedule cron job to check and send daily report every hour
-- The edge function will check if notifications are enabled and if it's the right time
SELECT cron.schedule(
  'send-daily-report-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nrkeyhmkygarlkvbhkwf.supabase.co/functions/v1/send-daily-report?cron_check=true',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ya2V5aG1reWdhcmxrdmJoa3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjYxNDMsImV4cCI6MjA2NzA0MjE0M30.8jsjH-LR9J2AEPMKWe6ypMUJggD93qPmAD-nfMpZt54"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);