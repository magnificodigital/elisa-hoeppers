-- SEGURANÇA: cupom de boas-vindas só vale para o e-mail dono e na primeira compra.
CREATE OR REPLACE FUNCTION public.place_order(p_items jsonb, p_customer_name text, p_customer_email text, p_customer_phone text, p_customer_address jsonb DEFAULT NULL::jsonb, p_notes text DEFAULT NULL::text, p_shipping_service_id text DEFAULT NULL::text, p_shipping_service_label text DEFAULT NULL::text, p_shipping_cents integer DEFAULT 0, p_destination_cep text DEFAULT NULL::text, p_coupon_code text DEFAULT NULL::text)
 RETURNS TABLE(order_id uuid, code text, subtotal_cents integer, discount_cents integer, total_cents integer, coupon_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_id uuid; v_code text; v_subtotal int := 0; v_discount int := 0; v_total int;
  v_validated_items jsonb := '[]'::jsonb; v_item jsonb; v_pid uuid; v_qty int;
  v_product record; v_attempt int := 0; v_coupon public.coupons; v_coupon_code text := null; v_cart_key text;
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

  -- Frete: nunca vem confiado do navegador. Com serviço escolhido, o preço precisa bater com uma
  -- cotação feita pelo servidor (me-calculate-shipping) para o mesmo CEP e o mesmo carrinho.
  if coalesce(p_shipping_cents, 0) < 0 then raise exception 'frete inválido'; end if;
  if p_shipping_service_id is null or trim(p_shipping_service_id) = '' then
    if coalesce(p_shipping_cents, 0) <> 0 then raise exception 'frete inválido'; end if;
  else
    select string_agg(pid || ':' || q, ',' order by pid collate "C") into v_cart_key
      from (select (e->>'product_id') pid, sum((e->>'qty')::int) q
              from jsonb_array_elements(p_items) e
             where (e->>'qty')::int >= 1 group by 1) t;
    if not exists (
      select 1 from public.shipping_quotes sq
       where sq.cep = regexp_replace(coalesce(p_destination_cep, ''), '\D', '', 'g')
         and sq.cart_key = v_cart_key
         and sq.service_id = p_shipping_service_id
         and sq.price_cents = p_shipping_cents
         and sq.created_at > now() - interval '3 hours'
    ) then
      raise exception 'frete expirado ou inválido, calcule o frete novamente';
    end if;
  end if;

  -- Cupom (lock atômico)
  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon from public.coupons
      where upper(code) = upper(trim(p_coupon_code)) for update;
    if v_coupon.id is null then raise exception 'cupom inválido'; end if;
    if v_coupon.active = false then raise exception 'cupom indisponível'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then raise exception 'cupom expirado'; end if;
    if v_coupon.max_uses is not null and v_coupon.uses_count >= v_coupon.max_uses then raise exception 'cupom já utilizado'; end if;
    -- Cupom de boas-vindas (gerado pelo banner): só para o e-mail dono e só na primeira compra.
    if coalesce(v_coupon.source, '') <> 'admin' then
      if lower(trim(v_coupon.email)) <> lower(trim(p_customer_email)) then
        raise exception 'cupom válido apenas para o e-mail cadastrado';
      end if;
      if exists (select 1 from public.orders o
                  where lower(o.customer_email) = lower(trim(p_customer_email))
                    and o.status in ('confirmed', 'shipped', 'completed')) then
        raise exception 'cupom válido apenas na primeira compra';
      end if;
    end if;
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
end; $function$

;
