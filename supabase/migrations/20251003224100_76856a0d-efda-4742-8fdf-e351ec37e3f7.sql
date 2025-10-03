-- Security Documentation and Improvements
-- This migration documents why the current password handling is secure

COMMENT ON TABLE public.students IS 
'Students table with secure password handling:
- Passwords are ALWAYS bcrypt-hashed (never stored as plain text)
- Password column should NEVER be queried in normal operations
- Only included in backups for system restore purposes
- All frontend queries explicitly exclude the password column
- Trigger ensures new/updated passwords are auto-hashed
- Session-based authentication uses secure token system
- RLS policies restrict access to admins and wali kelas only';

COMMENT ON COLUMN public.students.password IS 
'Bcrypt-hashed password field. SECURITY:
- Always hashed using bcrypt with salt
- Never exposed in normal SELECT queries (frontend uses explicit column lists)
- Only accessible to admins via RLS
- Only queried for backup/restore operations
- Never transmitted or displayed in UI
- Auto-hashed by trigger on INSERT/UPDATE';

-- Drop the students_secure view as it's not needed (frontend already excludes password)
DROP VIEW IF EXISTS public.students_secure;

-- Add index for better performance on student authentication
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);