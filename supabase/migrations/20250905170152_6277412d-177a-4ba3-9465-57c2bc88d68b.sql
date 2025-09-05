-- Create the app_role enum type that was missing
CREATE TYPE public.app_role AS ENUM ('admin', 'wali_kelas', 'student');

-- Update the profiles table to use the enum type
ALTER TABLE public.profiles ALTER COLUMN role TYPE app_role USING role::app_role;

-- Update the handle_new_user function to work correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'admin'::app_role
  );
  return new;
end;
$function$;