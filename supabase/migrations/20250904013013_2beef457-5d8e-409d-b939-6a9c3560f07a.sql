-- Fix Auth OTP long expiry - set to recommended 5 minutes (300 seconds)
UPDATE auth.config 
SET otp_expiry = 300 
WHERE id = 1;

-- Enable leaked password protection for better security
UPDATE auth.config 
SET enable_leaked_password_protection = true 
WHERE id = 1;

-- Update other security settings for production readiness
UPDATE auth.config 
SET 
  session_timeout_seconds = 3600,  -- 1 hour session timeout
  max_password_length = 72,        -- Maximum password length
  password_min_length = 8          -- Minimum password length
WHERE id = 1;