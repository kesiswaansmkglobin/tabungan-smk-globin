-- Add unique constraint to prevent duplicate user assignments
ALTER TABLE public.wali_kelas 
ADD CONSTRAINT wali_kelas_user_id_key 
UNIQUE (user_id);