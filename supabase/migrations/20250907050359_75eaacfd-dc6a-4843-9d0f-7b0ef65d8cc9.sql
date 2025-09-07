-- Create a function to create confirmed users (admin only)
CREATE OR REPLACE FUNCTION create_confirmed_user(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create confirmed users';
  END IF;

  -- Use auth.users to create a confirmed user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"' || user_name || '"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new_user_id, user_email, user_name, 'wali_kelas');

  RETURN new_user_id;
END;
$$;