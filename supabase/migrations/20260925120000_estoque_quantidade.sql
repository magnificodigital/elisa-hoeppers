-- Estoque por quantidade
-- stock_qty NULL = produto não controla quantidade (comportamento antigo: só o "Em estoque").
-- Com quantidade: in_stock vira automático, pedido pago dá baixa, cancelado devolve,
-- toda mudança fica registrada em stock_movements.

alter table public.products
  add column if not exists stock_qty integer,
  add column if not exists low_stock_threshold integer not null default 2,
  add column if not exists cost_cents integer;

alter table public.orders
  add column if not exists stock_applied boolean not null default false;

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  delta integer not null,
  balance_after integer,
  reason text not null default 'ajuste'
    check (reason in ('venda','cancelamento','entrada','saida','inventario','ajuste')),
  order_id uuid references public.orders(id) on delete set null,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

alter table public.stock_movements enable row level security;
grant select on public.stock_movements to authenticated;
grant all on public.stock_movements to service_role;
drop policy if exists "stock_movements_admin_read" on public.stock_movements;
create policy "stock_movements_admin_read" on public.stock_movements
  for select to authenticated using (public.is_admin());

-- 1) in_stock automático quando a quantidade é controlada
create or replace function public.products_sync_in_stock()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.stock_qty is not null then
    new.in_stock := new.stock_qty > 0;
  end if;
  return new;
end; $$;

drop trigger if exists products_sync_in_stock on public.products;
create trigger products_sync_in_stock
  before insert or update of stock_qty, in_stock on public.products
  for each row execute function public.products_sync_in_stock();

-- 2) Histórico + alertas (estoque baixo, volta ao estoque → lista de espera)
create or replace function public.products_after_stock_change()
returns trigger language plpgsql security definer set search_path = public as $$
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
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := jsonb_build_object('type', 'low_stock', 'record_id', new.id),
        timeout_milliseconds := 10000);
    end if;
  end if;

  -- Voltou a ficar disponível → avisa a lista de espera
  if tg_op = 'UPDATE' and old.in_stock = false and new.in_stock = true then
    perform net.http_post(
      url := v_fn,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('type', 'waitlist_restock', 'payload', jsonb_build_object('product_id', new.id)),
      timeout_milliseconds := 10000);
  end if;
  return new;
end; $$;

drop trigger if exists products_after_stock_change on public.products;
create trigger products_after_stock_change
  after insert or update of stock_qty, in_stock on public.products
  for each row execute function public.products_after_stock_change();

-- Aplica um delta em produto com quantidade controlada, registrando o motivo.
create or replace function public._stock_apply(p_product uuid, p_delta int, p_reason text, p_order uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('bodyoga.stock_reason', coalesce(p_reason, ''), true);
  perform set_config('bodyoga.stock_order', coalesce(p_order::text, ''), true);
  perform set_config('bodyoga.stock_note', coalesce(p_note, ''), true);
  update public.products set stock_qty = stock_qty + p_delta
    where id = p_product and stock_qty is not null;
  perform set_config('bodyoga.stock_reason', '', true);
  perform set_config('bodyoga.stock_order', '', true);
  perform set_config('bodyoga.stock_note', '', true);
end; $$;
revoke all on function public._stock_apply(uuid, int, text, uuid, text) from public, anon, authenticated;

-- 3) Baixa quando o pedido é pago; devolve quando é cancelado
create or replace function public.orders_apply_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_paid boolean := new.status in ('confirmed', 'shipped', 'completed');
  -- Só a TRANSIÇÃO pra pago dá baixa (confirmado→enviado não; pedidos antigos também não).
  v_was_paid boolean := tg_op = 'UPDATE' and old.status in ('confirmed', 'shipped', 'completed');
begin
  if v_paid and not v_was_paid and not new.stock_applied then
    for v_item in select * from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) loop
      if v_item ? 'product_id' then
        perform public._stock_apply((v_item->>'product_id')::uuid, -greatest((v_item->>'qty')::int, 0),
                                    'venda', new.id, 'Pedido #' || new.code);
      end if;
    end loop;
    new.stock_applied := true;
  elsif new.status = 'cancelled' and new.stock_applied then
    for v_item in select * from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) loop
      if v_item ? 'product_id' then
        perform public._stock_apply((v_item->>'product_id')::uuid, greatest((v_item->>'qty')::int, 0),
                                    'cancelamento', new.id, 'Pedido #' || new.code || ' cancelado');
      end if;
    end loop;
    new.stock_applied := false;
  end if;
  return new;
end; $$;

drop trigger if exists orders_apply_stock on public.orders;
create trigger orders_apply_stock
  before insert or update of status on public.orders
  for each row execute function public.orders_apply_stock();

-- 4) Ajuste pelo admin (entrada, saída, contagem de inventário, desligar controle)
create or replace function public.admin_stock_adjust(p_product_id uuid, p_mode text, p_qty int, p_note text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_cur int;
  v_new int;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select stock_qty into v_cur from public.products where id = p_product_id for update;
  if not found then raise exception 'produto não encontrado'; end if;

  if p_mode = 'desativar' then
    update public.products set stock_qty = null where id = p_product_id;
    return null;
  end if;
  if p_qty is null or p_qty < 0 then raise exception 'quantidade inválida'; end if;

  v_new := case p_mode
    when 'entrada' then coalesce(v_cur, 0) + p_qty
    when 'saida' then coalesce(v_cur, 0) - p_qty
    when 'inventario' then p_qty
    else null end;
  if v_new is null then raise exception 'modo inválido: %', p_mode; end if;

  perform set_config('bodyoga.stock_reason', p_mode, true);
  perform set_config('bodyoga.stock_note', coalesce(p_note, ''), true);
  update public.products set stock_qty = v_new where id = p_product_id;
  perform set_config('bodyoga.stock_reason', '', true);
  perform set_config('bodyoga.stock_note', '', true);
  return v_new;
end; $$;
grant execute on function public.admin_stock_adjust(uuid, text, int, text) to authenticated;

-- 5) place_order: não deixa comprar mais do que tem
create or replace function public.place_order(p_items jsonb, p_customer_name text, p_customer_email text, p_customer_phone text, p_customer_address jsonb default null::jsonb, p_notes text default null::text, p_shipping_service_id text default null::text, p_shipping_service_label text default null::text, p_shipping_cents integer default 0, p_destination_cep text default null::text, p_coupon_code text default null::text)
 returns table(order_id uuid, code text, subtotal_cents integer, discount_cents integer, total_cents integer, coupon_code text)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_order_id uuid; v_code text; v_subtotal int := 0; v_discount int := 0; v_total int;
  v_validated_items jsonb := '[]'::jsonb; v_item jsonb; v_pid uuid; v_qty int;
  v_product record; v_attempt int := 0; v_coupon public.coupons; v_coupon_code text := null;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'cart empty'; end if;
  if p_customer_name is null or trim(p_customer_name) = '' then raise exception 'name required'; end if;
  if p_customer_email is null or trim(p_customer_email) = '' then raise exception 'email required'; end if;
  if p_customer_phone is null or trim(p_customer_phone) = '' then raise exception 'phone required'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    if v_qty < 1 then continue; end if;
    select id, slug, name, price_cents, in_stock, is_active, stock_qty into v_product
      from public.products where id = v_pid;
    if v_product.id is null or not v_product.is_active then
      raise exception 'product not available: %', v_pid;
    end if;
    if not v_product.in_stock then
      raise exception 'product out of stock: %', v_product.name;
    end if;
    if v_product.stock_qty is not null and v_product.stock_qty < v_qty then
      raise exception 'product out of stock: % (restam %)', v_product.name, v_product.stock_qty;
    end if;
    v_subtotal := v_subtotal + (v_product.price_cents * v_qty);
    v_validated_items := v_validated_items || jsonb_build_object(
      'product_id', v_product.id, 'slug', v_product.slug, 'name', v_product.name,
      'qty', v_qty, 'unit_price_cents', v_product.price_cents,
      'total_cents', v_product.price_cents * v_qty);
  end loop;

  if jsonb_array_length(v_validated_items) = 0 then raise exception 'no valid items'; end if;

  -- Cupom (lock atômico)
  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon from public.coupons
      where upper(code) = upper(trim(p_coupon_code)) for update;
    if v_coupon.id is null then raise exception 'cupom inválido'; end if;
    if v_coupon.active = false then raise exception 'cupom indisponível'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then raise exception 'cupom expirado'; end if;
    if v_coupon.max_uses is not null and v_coupon.uses_count >= v_coupon.max_uses then raise exception 'cupom já utilizado'; end if;
    v_discount := floor(v_subtotal * v_coupon.discount_percent / 100.0)::int;
    if v_discount > v_subtotal then v_discount := v_subtotal; end if;
    v_coupon_code := v_coupon.code;
  end if;

  v_total := v_subtotal + coalesce(p_shipping_cents, 0) - v_discount;
  if v_total < 0 then v_total := 0; end if;

  loop
    v_code := public.gen_order_code();
    begin
      insert into public.orders
        (code, user_id, customer_name, customer_email, customer_phone, customer_address,
         items, subtotal_cents, shipping_cents, total_cents, notes, status,
         shipping_service_id, shipping_service_label, shipping_destination_cep,
         discount_cents, coupon_code)
      values
        (v_code, auth.uid(), trim(p_customer_name), trim(p_customer_email), trim(p_customer_phone), p_customer_address,
         v_validated_items, v_subtotal, coalesce(p_shipping_cents, 0), v_total, p_notes, 'pending',
         p_shipping_service_id, p_shipping_service_label, p_destination_cep,
         v_discount, v_coupon_code)
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'could not generate unique code'; end if;
    end;
  end loop;

  -- Consome o cupom: incrementa uses_count e registra último uso
  if v_coupon.id is not null then
    update public.coupons
      set uses_count = uses_count + 1, used_at = now(), used_order_id = v_order_id
      where id = v_coupon.id;
  end if;

  return query select v_order_id, v_code, v_subtotal, v_discount, v_total, v_coupon_code;
end; $function$;

-- Pedidos já pagos antes do controle de quantidade não descontam nada retroativamente
-- (a quantidade inicial vem da contagem feita pela Elisa).
