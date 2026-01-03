-- Create notification settings table
CREATE TABLE public.notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  whatsapp_send_time time NOT NULL DEFAULT '17:00:00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notification settings
CREATE POLICY "Only admins can read notification settings"
ON public.notification_settings
FOR SELECT
USING (is_admin());

CREATE POLICY "Only admins can insert notification settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update notification settings"
ON public.notification_settings
FOR UPDATE
USING (is_admin());

-- Insert default settings
INSERT INTO public.notification_settings (whatsapp_enabled, whatsapp_send_time)
VALUES (false, '17:00:00');

-- Create trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();