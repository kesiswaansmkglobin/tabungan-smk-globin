-- Add RLS policy for student_sessions table
-- Students should not be able to view or manipulate sessions directly
-- Only the security definer functions should access this table

CREATE POLICY "No direct access to student sessions"
ON public.student_sessions
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

COMMENT ON POLICY "No direct access to student sessions" ON public.student_sessions IS 'Prevents direct access to session table. All access must go through security definer functions.';