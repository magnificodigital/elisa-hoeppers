-- Pedido pago e enviado pra Awise que é cancelado no site → cancela também na Awise.
-- Apple Pay / Google Pay contam como cartão (recebimento em D+30).
create or replace function public.orders_awise_push()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_token text;
  v_action text;
begin
  if not exists (select 1 from public.app_settings where key = 'awise_enabled' and value = 'true') then
    return new;
  end if;
  if new.status in ('confirmed','shipped','completed')
     and (tg_op = 'INSERT' or old.status not in ('confirmed','shipped','completed'))
     and new.awise_order_id is null
     and exists (select 1 from public.app_settings where key = 'awise_push_orders' and value = 'true') then
    v_action := 'push_order';
  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status <> 'cancelled' and new.awise_order_id is not null then
    v_action := 'cancel_order';
  end if;
  if v_action is not null then
    select value into v_token from public.app_settings where key = 'awise_webhook_token';
    perform net.http_post(
      url := 'https://rjksutoohsvwqnqlemjv.supabase.co/functions/v1/awise',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-token', v_token),
      body := jsonb_build_object('action', v_action, 'order_id', new.id),
      timeout_milliseconds := 30000);
  end if;
  return new;
end; $$;
