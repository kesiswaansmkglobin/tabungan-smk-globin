-- Add admin phone number to notification settings
ALTER TABLE public.notification_settings
ADD COLUMN admin_whatsapp_number text NOT NULL DEFAULT '';

-- Create a function to check and send daily report
CREATE OR REPLACE FUNCTION public.should_send_daily_report()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  settings_record notification_settings%ROWTYPE;
  current_time_wib time;
BEGIN
  -- Get notification settings
  SELECT * INTO settings_record FROM public.notification_settings LIMIT 1;
  
  IF NOT FOUND OR NOT settings_record.whatsapp_enabled THEN
    RETURN false;
  END IF;
  
  -- Get current time in WIB (UTC+7)
  current_time_wib := (now() AT TIME ZONE 'Asia/Jakarta')::time;
  
  -- Check if current hour matches the scheduled hour (within the same hour)
  IF EXTRACT(HOUR FROM current_time_wib) = EXTRACT(HOUR FROM settings_record.whatsapp_send_time) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;