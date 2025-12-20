-- Add signature column to school_data table
ALTER TABLE public.school_data 
ADD COLUMN IF NOT EXISTS tanda_tangan_pengelola text;

COMMENT ON COLUMN public.school_data.tanda_tangan_pengelola IS 'Base64 encoded signature image of the school administrator';