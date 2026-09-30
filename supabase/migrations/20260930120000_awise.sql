-- Integração com a Awise (ERP): vínculo de produtos, pedidos enviados e configurações.

alter table public.products
  add column if not exists awise_product_id text unique,
  add column if not exists awise_meta_product_id text,
  add column if not exists awise_synced_at timestamptz;

alter table public.orders
  add column if not exists awise_order_id text,
  add column if not exists awise_pushed_at timestamptz,
  add column if not exists awise_error text;
create index if not exists orders_awise_order_idx on public.orders (awise_order_id);

-- Estoque vindo da Awise (fonte da verdade): grava e registra no histórico.
create or replace function public.awise_set_stock(p_product_id uuid, p_qty int)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('bodyoga.stock_reason', 'ajuste', true);
  perform set_config('bodyoga.stock_note', 'Sincronizado da Awise', true);
  update public.products set stock_qty = greatest(p_qty, 0) where id = p_product_id;
  perform set_config('bodyoga.stock_reason', '', true);
  perform set_config('bodyoga.stock_note', '', true);
end; $$;
revoke all on function public.awise_set_stock(uuid, int) from public, anon, authenticated;
grant execute on function public.awise_set_stock(uuid, int) to service_role;

insert into public.app_settings (key, value, category, is_secret, label, description, display_order) values
  ('awise_enabled',          'true',  'awise', false, 'Integração ativa', 'Liga a integração com a Awise.', 1),
  ('awise_push_orders',      'true',  'awise', false, 'Enviar pedidos pagos', 'Cada pedido pago no site vira um pedido faturado na Awise (baixa estoque e entra no financeiro).', 2),
  ('awise_emit_nfe',         'false', 'awise', false, 'Emitir NF-e pela Awise', 'Ligar só depois que os dados fiscais estiverem completos na Awise.', 3),
  ('awise_sync_stock',       'false', 'awise', false, 'Estoque vem da Awise', 'Ligar depois que todos os produtos estiverem cadastrados e contados na Awise.', 4),
  ('awise_sync_price',       'false', 'awise', false, 'Preço vem da Awise', 'Se ligado, o preço do site é atualizado com o preço de venda da Awise.', 4),
  ('awise_create_missing',   'false', 'awise', false, 'Criar produtos novos da Awise', 'Produtos cadastrados na Awise aparecem no site como rascunho.', 5),
  ('awise_payment_card_id',  '',      'awise', false, 'Forma de pagamento (cartão)', 'ID da forma de pagamento na Awise usada para vendas no cartão.', 6),
  ('awise_payment_pix_id',   '',      'awise', false, 'Forma de pagamento (PIX)', 'ID da forma de pagamento na Awise usada para vendas no PIX.', 7),
  ('awise_webhook_token',    encode(gen_random_bytes(18), 'hex'), 'awise', true, 'Token do webhook', 'Protege o endereço que recebe os avisos da Awise.', 8),
  ('awise_last_sync',        '',      'awise', false, 'Última sincronização', '', 9)
on conflict (key) do nothing;

-- Pedido pago → envia pra Awise (a função confere se está ligado e se já foi enviado).
create or replace function public.orders_awise_push()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_token text;
begin
  if new.status in ('confirmed','shipped','completed')
     and (tg_op = 'INSERT' or old.status not in ('confirmed','shipped','completed'))
     and new.awise_order_id is null
     and exists (select 1 from public.app_settings where key = 'awise_enabled' and value = 'true')
     and exists (select 1 from public.app_settings where key = 'awise_push_orders' and value = 'true') then
    select value into v_token from public.app_settings where key = 'awise_webhook_token';
    perform net.http_post(
      url := 'https://rjksutoohsvwqnqlemjv.supabase.co/functions/v1/awise',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-token', v_token),
      body := jsonb_build_object('action', 'push_order', 'order_id', new.id),
      timeout_milliseconds := 30000);
  end if;
  return new;
end; $$;

drop trigger if exists orders_awise_push on public.orders;
create trigger orders_awise_push
  after insert or update of status on public.orders
  for each row execute function public.orders_awise_push();
