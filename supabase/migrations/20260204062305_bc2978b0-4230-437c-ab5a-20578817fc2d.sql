-- Staff should NOT be able to access student password and qr_login_token columns
-- First drop the problematic policies and function

-- Drop the problematic staff update policy
DROP POLICY IF EXISTS "Staff can update student balance" ON public.students;

-- Create a secure function for staff to update student balance only
CREATE OR REPLACE FUNCTION public.staff_update_student_balance(
  p_student_id uuid,
  p_new_saldo integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is staff
  IF NOT is_staff() THEN
    RAISE EXCEPTION 'Only staff can update student balance';
  END IF;
  
  -- Update only the saldo column
  UPDATE public.students
  SET saldo = p_new_saldo, updated_at = now()
  WHERE id = p_student_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.staff_update_student_balance(uuid, integer) TO authenticated;

-- Staff should use get_students_for_staff() SECURITY DEFINER function
-- which already excludes password and qr_login_token columns
-- No need to modify that function since it already works correctly

-- Ensure there's no direct SELECT policy for staff on students table
-- Staff must use the RPC function get_students_for_staff() instead
DROP POLICY IF EXISTS "Staff can read limited student data" ON public.students;