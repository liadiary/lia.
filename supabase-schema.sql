-- Flourish Review Hub: run once in Supabase > SQL Editor.
-- Accounts are created separately in Authentication > Users.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  bd_name text check (bd_name in ('Adriana','Kristin','Stella','Liora') or bd_name is null),
  is_admin boolean not null default false,
  can_view_all boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.review_projects (
  id uuid primary key,
  owner_bd text not null check (owner_bd in ('Adriana','Kristin','Stella','Liora')),
  payload jsonb not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.review_projects enable row level security;

create or replace function public.is_flourish_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

create or replace function public.current_bd_name()
returns text language sql stable security definer set search_path = public
as $$ select bd_name from public.profiles where id = auth.uid() $$;

create or replace function public.can_view_all_reviews()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select is_admin or can_view_all from public.profiles where id = auth.uid()), false) $$;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated
using (id = auth.uid());

drop policy if exists "admin reads profiles" on public.profiles;
create policy "admin reads profiles" on public.profiles for select to authenticated
using (public.is_flourish_admin());

drop policy if exists "visible review projects" on public.review_projects;
create policy "visible review projects" on public.review_projects for select to authenticated
using (public.can_view_all_reviews() or owner_bd = public.current_bd_name());

drop policy if exists "create permitted review projects" on public.review_projects;
create policy "create permitted review projects" on public.review_projects for insert to authenticated
with check (public.is_flourish_admin() or owner_bd = public.current_bd_name());

drop policy if exists "update permitted review projects" on public.review_projects;
create policy "update permitted review projects" on public.review_projects for update to authenticated
using (public.is_flourish_admin() or owner_bd = public.current_bd_name())
with check (public.is_flourish_admin() or owner_bd = public.current_bd_name());

drop policy if exists "admin deletes review projects" on public.review_projects;
create policy "admin deletes review projects" on public.review_projects for delete to authenticated
using (public.is_flourish_admin());

revoke all on public.profiles from anon;
revoke all on public.review_projects from anon;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.review_projects to authenticated;
