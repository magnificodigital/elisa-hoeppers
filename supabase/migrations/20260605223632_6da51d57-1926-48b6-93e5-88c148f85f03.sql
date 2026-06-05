alter table public.modules enable row level security;

grant select on public.modules to anon, authenticated;
grant all on public.modules to service_role;

drop policy if exists "modules_public_select" on public.modules;
create policy "modules_public_select"
  on public.modules for select
  using (true);

drop policy if exists "modules_admin_all" on public.modules;
create policy "modules_admin_all"
  on public.modules for all
  using (public.is_admin())
  with check (public.is_admin());