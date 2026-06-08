-- 7 settings do remetente
insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values
  ('me_sender_name', '', 'melhorenvio', false, 'Nome do remetente', 'Nome completo (PF) ou razão social (PJ). Aparece na etiqueta.', 10),
  ('me_sender_document', '', 'melhorenvio', true, 'CPF ou CNPJ do remetente', 'Só números. Ex: 12345678900 (CPF) ou 12345678000190 (CNPJ).', 11),
  ('me_sender_phone', '', 'melhorenvio', false, 'Telefone do remetente', 'Com DDD, só números. Ex: 11994061178.', 12),
  ('me_sender_email', '', 'melhorenvio', false, 'Email do remetente', 'Pra contato dos Correios/transportadora se houver problema.', 13),
  ('me_sender_number', '', 'melhorenvio', false, 'Número do endereço', 'Número da casa/edifício. Ex: 123.', 14),
  ('me_sender_district', '', 'melhorenvio', false, 'Bairro', 'Bairro do endereço de origem.', 15),
  ('me_sender_city_state', '', 'melhorenvio', false, 'Cidade/UF', 'Formato: São Paulo/SP', 16)
on conflict (key) do nothing;

-- colunas de envio em orders
alter table public.orders add column if not exists shipping_service_id text;
alter table public.orders add column if not exists shipping_service_label text;
alter table public.orders add column if not exists shipping_destination_cep text;
alter table public.orders add column if not exists me_order_id text;
alter table public.orders add column if not exists me_label_url text;
alter table public.orders add column if not exists me_status text;

-- substitui place_order (precisa dropar a antiga: assinatura diferente)
drop function if exists public.place_order(jsonb, text, text, text, jsonb, text);

create or replace function public.place_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_address jsonb default null,
  p_notes text default null,
  p_shipping_service_id text default null,
  p_shipping_service_label text default null,
  p_shipping_cents int default 0,
  p_destination_cep text default null
)
returns table (order_id uuid, code text, subtotal_cents int, total_cents int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_code text;
  v_subtotal int := 0;
  v_total int;
  v_validated_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_pid uuid;
  v_qty int;
  v_product record;
  v_attempt int := 0;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'cart empty'; end if;
  if p_customer_name is null or trim(p_customer_name) = '' then raise exception 'name required'; end if;
  if p_customer_email is null or trim(p_customer_email) = '' then raise exception 'email required'; end if;
  if p_customer_phone is null or trim(p_customer_phone) = '' then raise exception 'phone required'; end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    if v_qty < 1 then continue; end if;
    select id, slug, name, price_cents, in_stock, is_active
      into v_product
      from public.products where id = v_pid;
    if v_product.id is null or not v_product.is_active then
      raise exception 'product not available: %', v_pid;
    end if;
    if not v_product.in_stock then
      raise exception 'product out of stock: %', v_product.name;
    end if;
    v_subtotal := v_subtotal + (v_product.price_cents * v_qty);
    v_validated_items := v_validated_items || jsonb_build_object(
      'product_id', v_product.id,
      'slug', v_product.slug,
      'name', v_product.name,
      'qty', v_qty,
      'unit_price_cents', v_product.price_cents,
      'total_cents', v_product.price_cents * v_qty
    );
  end loop;

  if jsonb_array_length(v_validated_items) = 0 then raise exception 'no valid items'; end if;

  v_total := v_subtotal + coalesce(p_shipping_cents, 0);

  loop
    v_code := public.gen_order_code();
    begin
      insert into public.orders
        (code, user_id, customer_name, customer_email, customer_phone, customer_address,
         items, subtotal_cents, shipping_cents, total_cents, notes, status,
         shipping_service_id, shipping_service_label, shipping_destination_cep)
      values
        (v_code, auth.uid(), trim(p_customer_name), trim(p_customer_email), trim(p_customer_phone), p_customer_address,
         v_validated_items, v_subtotal, coalesce(p_shipping_cents, 0), v_total, p_notes, 'pending',
         p_shipping_service_id, p_shipping_service_label, p_destination_cep)
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'could not generate unique code'; end if;
    end;
  end loop;

  return query select v_order_id, v_code, v_subtotal, v_total;
end;
$$;