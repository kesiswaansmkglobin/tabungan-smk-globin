begin;

-- Fix school_data table RLS policies - remove public access
drop policy if exists "Allow select for all" on public.school_data;
drop policy if exists "Allow insert for all" on public.school_data;
drop policy if exists "Allow update for all" on public.school_data;
drop policy if exists "Allow delete for all" on public.school_data;

-- Create admin-only policies for school_data table
create policy "Only admins can read school data"
on public.school_data
for select
using (public.is_admin());

create policy "Only admins can insert school data"
on public.school_data
for insert
with check (public.is_admin());

create policy "Only admins can update school data"
on public.school_data
for update
using (public.is_admin());

create policy "Only admins can delete school data"
on public.school_data
for delete
using (public.is_admin());

commit;