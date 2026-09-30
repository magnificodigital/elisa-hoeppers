-- Gatilhos do banco chamam send-notification com o token interno (a function agora exige).
CREATE OR REPLACE FUNCTION public.products_after_stock_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_reason text := nullif(current_setting('bodyoga.stock_reason', true), '');
  v_order uuid := nullif(current_setting('bodyoga.stock_order', true), '')::uuid;
  v_note text := nullif(current_setting('bodyoga.stock_note', true), '');
  v_old int := case when tg_op = 'UPDATE' then old.stock_qty end;
  v_fn text := 'https://rjksutoohsvwqnqlemjv.supabase.co/functions/v1/send-notification';
begin
  if new.stock_qty is distinct from v_old and new.stock_qty is not null then
    insert into public.stock_movements (product_id, delta, balance_after, reason, order_id, note)
    values (new.id, new.stock_qty - coalesce(v_old, 0), new.stock_qty,
            coalesce(v_reason, case when v_old is null then 'inventario' else 'ajuste' end),
            v_order, v_note);

    -- Cruzou o limite de estoque baixo pra baixo → avisa a Elisa
    if new.stock_qty <= new.low_stock_threshold
       and (v_old is null or v_old > new.low_stock_threshold) then
      perform net.http_post(
        url := v_fn,
        headers := jsonb_build_object('Content-Type','application/json','x-internal-token',(select value from public.app_settings where key='awise_webhook_token')),
        body := jsonb_build_object('type', 'low_stock', 'record_id', new.id),
        timeout_milliseconds := 10000);
    end if;
  end if;

  -- Voltou a ficar disponível → avisa a lista de espera
  if tg_op = 'UPDATE' and old.in_stock = false and new.in_stock = true then
    perform net.http_post(
      url := v_fn,
      headers := jsonb_build_object('Content-Type','application/json','x-internal-token',(select value from public.app_settings where key='awise_webhook_token')),
      body := jsonb_build_object('type', 'waitlist_restock', 'payload', jsonb_build_object('product_id', new.id)),
      timeout_milliseconds := 10000);
  end if;
  return new;
end; $function$

;
