-- Run once in Supabase > SQL Editor to let a BD delete only their own records.
drop policy if exists "admin deletes review projects" on public.review_projects;
drop policy if exists "delete permitted review projects" on public.review_projects;

create policy "delete permitted review projects"
on public.review_projects
for delete
to authenticated
using (
  public.is_flourish_admin()
  or owner_bd = public.current_bd_name()
);
