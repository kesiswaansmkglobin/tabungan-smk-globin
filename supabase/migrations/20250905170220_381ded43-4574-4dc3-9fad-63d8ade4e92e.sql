-- Fix the handle_new_user function with correct search_path
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
    'admin'::public.app_role
  );
  return new;
end;
$function$;