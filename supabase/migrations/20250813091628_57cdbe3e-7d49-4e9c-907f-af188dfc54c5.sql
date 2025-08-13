begin;

-- Create user role enum
create type public.app_role as enum ('admin', 'teacher', 'student');

-- Create profiles table for user roles and additional info
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role app_role not null default 'student',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create security definer function to check user role
create or replace function public.get_current_user_role()
returns app_role
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Create security definer function to check if user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create function to handle new user creation (auto-create profile)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'admin'::app_role  -- Default new users to admin for now
  );
  return new;
end;
$$;

-- Create trigger for auto-profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles RLS policies
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles
for select
using (public.is_admin());

create policy "Admins can update all profiles"
on public.profiles
for update
using (public.is_admin());

create policy "Admins can insert profiles"
on public.profiles
for insert
with check (public.is_admin());

create policy "Admins can delete profiles"
on public.profiles
for delete
using (public.is_admin());

-- Update students table RLS policies to be admin-only
drop policy if exists "Students: authenticated can read" on public.students;
drop policy if exists "Students: authenticated can insert" on public.students;
drop policy if exists "Students: authenticated can update" on public.students;
drop policy if exists "Students: authenticated can delete" on public.students;

-- Create admin-only policies for students table
create policy "Only admins can read students"
on public.students
for select
using (public.is_admin());

create policy "Only admins can insert students"
on public.students
for insert
with check (public.is_admin());

create policy "Only admins can update students"
on public.students
for update
using (public.is_admin());

create policy "Only admins can delete students"
on public.students
for delete
using (public.is_admin());

-- Update transactions table RLS policies to be admin-only
drop policy if exists "Transactions: authenticated can read" on public.transactions;
drop policy if exists "Transactions: authenticated can insert" on public.transactions;
drop policy if exists "Transactions: authenticated can update" on public.transactions;
drop policy if exists "Transactions: authenticated can delete" on public.transactions;

-- Create admin-only policies for transactions table
create policy "Only admins can read transactions"
on public.transactions
for select
using (public.is_admin());

create policy "Only admins can insert transactions"
on public.transactions
for insert
with check (public.is_admin());

create policy "Only admins can update transactions"
on public.transactions
for update
using (public.is_admin());

create policy "Only admins can delete transactions"
on public.transactions
for delete
using (public.is_admin());

-- Update classes table RLS policies to be admin-only
drop policy if exists "Classes: authenticated can read" on public.classes;
drop policy if exists "Classes: authenticated can insert" on public.classes;
drop policy if exists "Classes: authenticated can update" on public.classes;
drop policy if exists "Classes: authenticated can delete" on public.classes;

-- Create admin-only policies for classes table
create policy "Only admins can read classes"
on public.classes
for select
using (public.is_admin());

create policy "Only admins can insert classes"
on public.classes
for insert
with check (public.is_admin());

create policy "Only admins can update classes"
on public.classes
for update
using (public.is_admin());

create policy "Only admins can delete classes"
on public.classes
for delete
using (public.is_admin());

-- Add updated_at trigger for profiles
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

commit;