-- Run once after the original schema to add the read-only supervisor role.
alter table public.profiles
add column if not exists can_view_all boolean not null default false;

create or replace function public.can_view_all_reviews()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select is_admin or can_view_all from public.profiles where id = auth.uid()), false) $$;

drop policy if exists "visible review projects" on public.review_projects;
create policy "visible review projects" on public.review_projects for select to authenticated
using (public.can_view_all_reviews() or owner_bd = public.current_bd_name());
