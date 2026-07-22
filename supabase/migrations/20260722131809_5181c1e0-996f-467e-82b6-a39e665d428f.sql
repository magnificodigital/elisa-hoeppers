
insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values
  ('asaas_enabled', 'false', 'asaas', false,
   'Habilitar Asaas',
   'Quando ligado, novos pedidos usam Asaas como gateway. MP continua funcionando pra pedidos antigos.',
   1),
  ('asaas_environment', 'sandbox', 'asaas', false,
   'Ambiente',
   'sandbox (testes) ou production (real).',
   2),
  ('asaas_api_key', '', 'asaas', true,
   'API Key',
   'Copie de asaas.com → Integrações → API. Use a key correspondente ao ambiente escolhido.',
   3),
  ('asaas_webhook_token', '', 'asaas', true,
   'Token do webhook',
   'Token único gerado por você (crypto.randomUUID). Cole aqui e no painel Asaas em Notificações → Webhook.',
   4)
on conflict (key) do nothing;

alter table public.orders add column if not exists asaas_customer_id text;
alter table public.orders add column if not exists asaas_payment_id text;
alter table public.orders add column if not exists asaas_payment_status text;
alter table public.orders add column if not exists asaas_pix_qr_code_image text;
alter table public.orders add column if not exists asaas_pix_qr_code_copy_paste text;
alter table public.orders add column if not exists asaas_pix_expires_at timestamptz;
alter table public.orders add column if not exists asaas_invoice_url text;

create index if not exists idx_orders_asaas_payment_id on public.orders(asaas_payment_id) where asaas_payment_id is not null;

alter table public.profiles add column if not exists asaas_customer_id text;
alter table public.profiles add column if not exists cpf_cnpj text;

drop function if exists public.get_order_by_code(text, text);

create or replace function public.get_order_by_code(p_code text, p_email text default null)
returns table (
  id uuid,
  user_id uuid,
  code text,
  customer_name text,
  items jsonb,
  subtotal_cents int,
  shipping_cents int,
  total_cents int,
  status public.order_status,
  tracking_code text,
  payment_method_type text,
  payment_installments int,
  created_at timestamptz,
  asaas_pix_qr_code_image text,
  asaas_pix_qr_code_copy_paste text,
  asaas_pix_expires_at timestamptz,
  asaas_invoice_url text
)
language plpgsql
stable security definer
set search_path = public
as $$
declare
  v_order record;
  v_user_id uuid := auth.uid();
begin
  select o.id, o.user_id, o.code, o.customer_name, o.customer_email, o.items,
         o.subtotal_cents, o.shipping_cents, o.total_cents, o.status, o.tracking_code,
         o.payment_method_type, o.payment_installments, o.created_at,
         o.asaas_pix_qr_code_image, o.asaas_pix_qr_code_copy_paste,
         o.asaas_pix_expires_at, o.asaas_invoice_url
    into v_order
    from public.orders o
    where o.code = p_code;

  if v_order.id is null then
    return;
  end if;

  if v_user_id is not null and v_order.user_id = v_user_id then
    return query select v_order.id, v_order.user_id, v_order.code, v_order.customer_name,
      v_order.items, v_order.subtotal_cents, v_order.shipping_cents, v_order.total_cents,
      v_order.status, v_order.tracking_code, v_order.payment_method_type,
      v_order.payment_installments, v_order.created_at,
      v_order.asaas_pix_qr_code_image, v_order.asaas_pix_qr_code_copy_paste,
      v_order.asaas_pix_expires_at, v_order.asaas_invoice_url;
    return;
  end if;

  if v_order.user_id is null then
    if p_email is null or lower(trim(p_email)) is distinct from lower(trim(v_order.customer_email)) then
      return;
    end if;
    return query select v_order.id, v_order.user_id, v_order.code, v_order.customer_name,
      v_order.items, v_order.subtotal_cents, v_order.shipping_cents, v_order.total_cents,
      v_order.status, v_order.tracking_code, v_order.payment_method_type,
      v_order.payment_installments, v_order.created_at,
      v_order.asaas_pix_qr_code_image, v_order.asaas_pix_qr_code_copy_paste,
      v_order.asaas_pix_expires_at, v_order.asaas_invoice_url;
    return;
  end if;

  return;
end;
$$;
