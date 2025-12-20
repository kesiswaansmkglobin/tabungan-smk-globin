-- Enable required extensions for cron job
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily report at 5 PM Indonesia time (10:00 UTC)
-- Cron format: minute hour day month day_of_week
SELECT cron.schedule(
  'send-daily-whatsapp-report',
  '0 10 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://nrkeyhmkygarlkvbhkwf.supabase.co/functions/v1/send-daily-report',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ya2V5aG1reWdhcmxrdmJoa3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjYxNDMsImV4cCI6MjA2NzA0MjE0M30.8jsjH-LR9J2AEPMKWe6ypMUJggD93qPmAD-nfMpZt54"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);