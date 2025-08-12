begin;

-- Ensure RLS is enabled on students table
alter table public.students enable row level security;

-- Remove overly-permissive public policies if they exist
drop policy if exists "Allow select for all" on public.students;
drop policy if exists "Allow insert for all" on public.students;
drop policy if exists "Allow update for all" on public.students;
drop policy if exists "Allow delete for all" on public.students;

-- Restrict access to authenticated users only
create policy "Students: authenticated can read"
on public.students
for select
to authenticated
using (true);

create policy "Students: authenticated can insert"
on public.students
for insert
to authenticated
with check (true);

create policy "Students: authenticated can update"
on public.students
for update
to authenticated
using (true);

create policy "Students: authenticated can delete"
on public.students
for delete
to authenticated
using (true);

commit;