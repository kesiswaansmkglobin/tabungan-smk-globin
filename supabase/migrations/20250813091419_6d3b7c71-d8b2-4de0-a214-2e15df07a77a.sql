begin;

-- Ensure RLS is enabled on students table (idempotent)
alter table public.students enable row level security;

-- Remove overly-permissive public policies if they exist (idempotent)
drop policy if exists "Allow select for all" on public.students;
drop policy if exists "Allow insert for all" on public.students;
drop policy if exists "Allow update for all" on public.students;
drop policy if exists "Allow delete for all" on public.students;

commit;