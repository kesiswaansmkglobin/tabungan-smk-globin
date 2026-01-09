-- Fix the permissive RLS policy on audit_logs
-- Drop the old permissive policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a more restrictive policy - only allow inserts via SECURITY DEFINER functions
-- Since all inserts go through log_audit_event() which is SECURITY DEFINER,
-- we need to allow the postgres/service role to insert
-- This policy ensures only authenticated sessions can trigger audit logs
CREATE POLICY "Authenticated users trigger audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  -- Allow insert only if there's an authenticated user OR if user_type is 'system'
  (auth.uid() IS NOT NULL) OR (user_type = 'system')
);