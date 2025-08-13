-- Fix RLS issues by ensuring there's at least one admin user for testing
-- First, let's check if there are any profiles created
-- If there are authenticated users without profiles, create admin profiles for them

-- Insert a test admin profile if none exists (this will help during development)
DO $$
BEGIN
  -- Create a profile for any existing authenticated users who don't have profiles yet
  -- This handles the case where users were created before the profile trigger was set up
  IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    -- If no users exist, we can't help with this migration
    -- The user needs to sign up first, then they'll get an admin profile automatically
    RAISE NOTICE 'No authenticated users found. Please sign up through the login form first.';
  ELSE
    -- For any existing auth users who don't have profiles, create admin profiles
    INSERT INTO public.profiles (id, email, full_name, role)
    SELECT 
      u.id,
      u.email,
      COALESCE(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
      'admin'::app_role
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL;
    
    RAISE NOTICE 'Created admin profiles for existing users without profiles.';
  END IF;
END $$;