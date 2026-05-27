-- ORDERS
create type order_status as enum ('pending', 'confirmed', 'shipped', 'cancelled', 'completed');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_address jsonb,
  items jsonb not null,
  subtotal_cents int not null,
  shipping_cents int not null default 0,
  total_cents int not null,
  status order_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (status, created_at desc);
create index on public.orders (user_id);
create trigger touch_orders before update on public.orders for each row execute procedure public.touch_updated_at();

grant select, insert, update on public.orders to authenticated;
grant select, insert on public.orders to anon;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

create policy "orders_read_own_or_staff" on public.orders
  for select using (
    user_id = auth.uid()
    or public.current_user_role() in ('instructor','admin')
  );
create policy "orders_update_staff" on public.orders
  for update using (public.current_user_role() in ('instructor','admin'))
  with check (public.current_user_role() in ('instructor','admin'));

create or replace function public.gen_order_code()
returns text language plpgsql as $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_i int;
begin
  for v_i in 1..6 loop
    v_code := v_code || substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1);
  end loop;
  return v_code;
end;
$$;

create or replace function public.place_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_address jsonb default null,
  p_notes text default null
)
returns table (order_id uuid, code text, subtotal_cents int, total_cents int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_pid uuid;
  v_qty int;
  v_product record;
  v_subtotal int := 0;
  v_validated_items jsonb := '[]'::jsonb;
  v_code text;
  v_attempt int := 0;
  v_order_id uuid;
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

  loop
    v_code := public.gen_order_code();
    begin
      insert into public.orders
        (code, user_id, customer_name, customer_email, customer_phone, customer_address,
         items, subtotal_cents, shipping_cents, total_cents, notes, status)
      values
        (v_code, v_user_id, trim(p_customer_name), trim(p_customer_email), trim(p_customer_phone), p_customer_address,
         v_validated_items, v_subtotal, 0, v_subtotal, p_notes, 'pending')
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'could not generate unique code'; end if;
    end;
  end loop;

  return query select v_order_id, v_code, v_subtotal, v_subtotal;
end;
$$;

grant execute on function public.place_order(jsonb, text, text, text, jsonb, text) to anon, authenticated;

create or replace function public.get_order_by_code(p_code text)
returns table (
  code text,
  customer_name text,
  items jsonb,
  subtotal_cents int,
  shipping_cents int,
  total_cents int,
  status order_status,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select o.code, o.customer_name, o.items, o.subtotal_cents, o.shipping_cents, o.total_cents, o.status, o.created_at
  from public.orders o
  where o.code = p_code;
end;
$$;

grant execute on function public.get_order_by_code(text) to anon, authenticated;