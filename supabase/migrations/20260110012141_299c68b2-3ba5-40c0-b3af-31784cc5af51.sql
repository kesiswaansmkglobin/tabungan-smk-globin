-- Create helper function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'staff'::public.app_role);
$$;

-- Allow staff to read students (needed for transaction input)
CREATE POLICY "Staff can read students for transactions"
ON public.students
FOR SELECT
USING (public.is_staff());

-- Allow staff to read classes (needed for student lookup)
CREATE POLICY "Staff can read classes for transactions"
ON public.classes
FOR SELECT
USING (public.is_staff());

-- Allow staff to insert transactions
CREATE POLICY "Staff can insert transactions"
ON public.transactions
FOR INSERT
WITH CHECK (public.is_staff());

-- Allow staff to read transactions (for daily history)
CREATE POLICY "Staff can read transactions"
ON public.transactions
FOR SELECT
USING (public.is_staff());

-- Allow staff to update students balance (via transaction trigger)
CREATE POLICY "Staff can update student balance"
ON public.students
FOR UPDATE
USING (public.is_staff())
WITH CHECK (public.is_staff());