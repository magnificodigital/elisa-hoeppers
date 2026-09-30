-- SEGURANÇA: a cliente pode cancelar o próprio pedido pendente, mas NÃO alterar nenhum outro campo
-- (itens, valores, endereço...). Antes dava pra cancelar mudando os itens e depois pagar o link antigo.
create or replace function public.orders_customer_only_cancel()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;  -- service role / functions
  if public.current_user_role() in ('admin'::user_role, 'instructor'::user_role) then return new; end if;
  if (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
    raise exception 'Só é possível cancelar o pedido.';
  end if;
  return new;
end; $$;

drop trigger if exists orders_customer_only_cancel on public.orders;
create trigger orders_customer_only_cancel
  before update on public.orders
  for each row execute function public.orders_customer_only_cancel();
