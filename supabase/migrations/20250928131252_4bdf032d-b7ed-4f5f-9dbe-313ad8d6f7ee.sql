-- Ensure trigger to keep students.saldo in sync with transactions inserts
-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_update_student_balance_after_insert'
  ) THEN
    CREATE TRIGGER tr_update_student_balance_after_insert
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_student_balance();
  END IF;
END $$;