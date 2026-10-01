-- Custo dos produtos só para o admin (a coluna será fechada ao público depois da publicação do site novo).
create or replace function public.admin_product_costs()
returns table(id uuid, cost_cents int)
language sql stable security definer set search_path = public as $$
  select p.id, p.cost_cents from public.products p where public.is_admin()
$$;
revoke all on function public.admin_product_costs() from public, anon;
grant execute on function public.admin_product_costs() to authenticated;
