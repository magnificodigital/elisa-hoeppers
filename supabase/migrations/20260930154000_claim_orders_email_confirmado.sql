-- SEGURANÇA: a confirmação de e-mail do login está desligada, então qualquer um pode criar conta
-- com o e-mail de outra pessoa. A reivindicação de pedidos de visitante fica limitada a pedidos
-- feitos pouco antes da criação da conta (caso real: comprou e criou a conta em seguida).
create or replace function public.claim_guest_orders()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if auth.uid() is null then return 0; end if;
  with me as (
    select email, created_at from auth.users where id = auth.uid() and email_confirmed_at is not null
  )
  update public.orders o
  set user_id = auth.uid()
  from me
  where o.user_id is null
    and lower(o.customer_email) = lower(me.email)
    and o.created_at >= me.created_at - interval '1 hour';
  get diagnostics v_count = row_count;
  return v_count;
end; $$;
