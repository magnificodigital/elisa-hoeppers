-- Financeiro (contas a pagar/receber, fluxo de caixa, DRE) + Entrada de mercadoria por XML
-- Lançamentos automáticos: pedido pago → receita; pedido pago cancelado → estorno;
-- etiqueta comprada → frete; nota de fornecedor importada → contas a pagar.

-- ============ CATEGORIAS ============
create table if not exists public.fin_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('receita','despesa')),
  -- Linha do DRE. 'estoque' = compra de mercadoria: sai do caixa, mas no DRE entra como CMV quando vende.
  dre_group text not null check (dre_group in (
    'receita_bruta','deducoes','taxas_vendas','frete','impostos',
    'despesas_operacionais','outras_receitas','outras_despesas','estoque','investimentos')),
  slug text unique,          -- categorias usadas pelos lançamentos automáticos
  display_order int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.fin_categories (slug, name, kind, dre_group, display_order)
select * from (values
  ('vendas',        'Vendas da loja',               'receita', 'receita_bruta', 1),
  (null,            'Cursos e aulas',               'receita', 'receita_bruta', 2),
  (null,            'Outras receitas',              'receita', 'outras_receitas', 9),
  ('estornos',      'Estornos e devoluções',        'despesa', 'deducoes', 10),
  ('taxas',         'Taxas de pagamento (Pagar.me)','despesa', 'taxas_vendas', 11),
  ('frete',         'Frete de envio (etiquetas)',   'despesa', 'frete', 12),
  ('mercadorias',   'Mercadorias / fornecedores',   'despesa', 'estoque', 13),
  (null,            'Impostos (DAS / Simples)',     'despesa', 'impostos', 14),
  (null,            'Embalagens',                   'despesa', 'despesas_operacionais', 20),
  (null,            'Marketing e anúncios',         'despesa', 'despesas_operacionais', 21),
  (null,            'Sistemas e assinaturas',       'despesa', 'despesas_operacionais', 22),
  (null,            'Contador',                     'despesa', 'despesas_operacionais', 23),
  (null,            'Salários e pró-labore',        'despesa', 'despesas_operacionais', 24),
  (null,            'Aluguel e contas',             'despesa', 'despesas_operacionais', 25),
  (null,            'Outras despesas',              'despesa', 'outras_despesas', 29),
  (null,            'Equipamentos e investimentos', 'despesa', 'investimentos', 30)
) v(slug, name, kind, dre_group, display_order)
where not exists (select 1 from public.fin_categories);

-- ============ FORNECEDORES / COMPRAS ============
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  cnpj text unique,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  nfe_key text unique,
  number text,
  series text,
  issued_at date,
  products_cents int not null default 0,
  freight_cents int not null default 0,
  discount_cents int not null default 0,
  other_cents int not null default 0,   -- IPI + ST + outras despesas da nota
  total_cents int not null default 0,
  notes text,
  xml text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  supplier_code text,
  ean text,
  description text not null,
  ncm text,
  unit text,
  qty numeric not null,
  multiplier numeric not null default 1,  -- unidades por item da nota (ex.: caixa com 12)
  units_in int not null default 0,        -- unidades que entraram no estoque
  unit_cost_cents int,                     -- custo por unidade já com frete/IPI/ST rateados
  total_cents int not null default 0
);
create index if not exists purchase_items_purchase_idx on public.purchase_items (purchase_id);

-- Memória: código do fornecedor → produto da loja (a próxima nota já vem vinculada)
create table if not exists public.supplier_product_map (
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_code text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  multiplier numeric not null default 1,
  primary key (supplier_id, supplier_code)
);

-- ============ LANÇAMENTOS ============
create table if not exists public.fin_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('receita','despesa')),
  description text not null,
  category_id uuid references public.fin_categories(id) on delete set null,
  amount_cents int not null check (amount_cents >= 0),
  due_date date not null,
  competence_date date not null,
  paid_at date,
  counterparty text,
  supplier_id uuid references public.suppliers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete cascade,
  source text not null default 'manual'
    check (source in ('manual','pedido','estorno','taxa','frete','compra','recorrente')),
  external_ref text unique,   -- idempotência dos lançamentos automáticos
  installment text,           -- "1/3"
  recurrence_group uuid,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fin_entries_due_idx on public.fin_entries (due_date);
create index if not exists fin_entries_comp_idx on public.fin_entries (competence_date);
create index if not exists fin_entries_order_idx on public.fin_entries (order_id);

drop trigger if exists touch_fin_entries on public.fin_entries;
create trigger touch_fin_entries before update on public.fin_entries
  for each row execute function public.touch_updated_at();

-- RLS: tudo só admin
do $$
declare t text;
begin
  foreach t in array array['fin_categories','fin_entries','suppliers','purchases','purchase_items','supplier_product_map'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin_all', t);
  end loop;
end $$;

-- Configurações do financeiro
insert into public.app_settings (key, value, category, is_secret, label, description, display_order) values
  ('fin_opening_balance_cents', '0', 'financeiro', false, 'Saldo inicial (centavos)', 'Saldo em caixa/banco na data inicial do financeiro.', 1),
  ('fin_opening_date', to_char(now(), 'YYYY-MM-DD'), 'financeiro', false, 'Data do saldo inicial', 'A partir de quando o financeiro é controlado.', 2),
  ('fin_card_days', '30', 'financeiro', false, 'Prazo de recebimento do cartão (dias)', 'Quantos dias a Pagar.me leva pra liberar vendas no cartão (usado só quando a conciliação não traz a data exata).', 3)
on conflict (key) do nothing;

-- ============ CUSTO DO ITEM NA HORA DA VENDA (para o CMV) ============
-- Reescreve o trigger de estoque para também gravar unit_cost_cents em cada item do pedido.
create or replace function public.orders_apply_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_cost int;
  v_paid boolean := new.status in ('confirmed', 'shipped', 'completed');
  -- Só a TRANSIÇÃO pra pago dá baixa (confirmado→enviado não; pedidos antigos também não).
  v_was_paid boolean := tg_op = 'UPDATE' and old.status in ('confirmed', 'shipped', 'completed');
begin
  if v_paid and not v_was_paid and not new.stock_applied then
    for v_item in select * from jsonb_array_elements(coalesce(new.items, '[]'::jsonb)) loop
      if v_item ? 'product_id' then
        perform public._stock_apply((v_item->>'product_id')::uuid, -greatest((v_item->>'qty')::int, 0),
                                    'venda', new.id, 'Pedido #' || new.code);
        select cost_cents into v_cost from public.products where id = (v_item->>'product_id')::uuid;
        if v_cost is not null and not (v_item ? 'unit_cost_cents') then
          v_item := v_item || jsonb_build_object('unit_cost_cents', v_cost);
        end if;
      end if;
      v_items := v_items || v_item;
    end loop;
    new.items := v_items;
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

-- ============ RECEITA AUTOMÁTICA DOS PEDIDOS ============
create or replace function public.fin_cat(p_slug text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.fin_categories where slug = p_slug
$$;

create or replace function public.orders_fin_entries()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_paid boolean := new.status in ('confirmed', 'shipped', 'completed');
  v_was_paid boolean := tg_op = 'UPDATE' and old.status in ('confirmed', 'shipped', 'completed');
  v_day date := coalesce(new.paid_at, now())::date;
  v_card boolean := coalesce(new.payment_method_type, '') ilike '%credit%';
  v_card_days int := coalesce((select nullif(value, '')::int from public.app_settings where key = 'fin_card_days'), 30);
  v_has_entries boolean;
begin
  if v_paid and not v_was_paid then
    -- Cartão: dinheiro cai depois (a conciliação da Pagar.me ajusta pras datas reais).
    insert into public.fin_entries (kind, description, category_id, amount_cents, due_date, competence_date,
                                    paid_at, counterparty, order_id, source, external_ref, notes)
    values ('receita', 'Pedido #' || new.code, public.fin_cat('vendas'), new.total_cents,
            case when v_card then v_day + v_card_days else v_day end, v_day,
            case when v_card then null else v_day end,
            new.customer_name, new.id, 'pedido', 'order:' || new.id,
            nullif(concat_ws(' · ', new.payment_method, new.payment_method_type,
                   case when coalesce(new.payment_installments, 1) > 1 then new.payment_installments || 'x' end), ''))
    on conflict (external_ref) do nothing;
  elsif new.status = 'cancelled' and v_was_paid then
    -- Receita ainda não recebida (cartão a liberar): só some. Já recebida: lança o estorno.
    delete from public.fin_entries
      where order_id = new.id and paid_at is null and source in ('pedido', 'taxa');
    select exists(select 1 from public.fin_entries where order_id = new.id and kind = 'receita') into v_has_entries;
    if v_has_entries then
      insert into public.fin_entries (kind, description, category_id, amount_cents, due_date, competence_date,
                                      paid_at, counterparty, order_id, source, external_ref)
      values ('despesa', 'Estorno pedido #' || new.code, public.fin_cat('estornos'), new.total_cents,
              current_date, current_date, current_date, new.customer_name, new.id, 'estorno',
              'refund:' || new.id || ':' || extract(epoch from now())::bigint)
      on conflict (external_ref) do nothing;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists orders_fin_entries on public.orders;
create trigger orders_fin_entries
  after insert or update of status on public.orders
  for each row execute function public.orders_fin_entries();

-- Custo do frete da etiqueta
alter table public.orders add column if not exists shipping_cost_cents int;

-- ============ IMPORTAÇÃO DE NOTA DE COMPRA ============
-- p: { supplier:{cnpj,name,email,phone}, nfe_key, number, series, issued_at,
--      products_cents, freight_cents, discount_cents, other_cents, total_cents, notes, xml,
--      items:[{product_id|null, supplier_code, ean, description, ncm, unit, qty, multiplier, unit_cost_cents, total_cents}],
--      payables:[{due_date, amount_cents, installment}], paid: bool }
create or replace function public.admin_import_purchase(p jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_sup uuid;
  v_pur uuid;
  v_item jsonb;
  v_pay jsonb;
  v_n bigint;
  v_units int;
  v_old_qty int;
  v_old_cost int;
  v_new_cost int;
  v_label text;
  v_paid boolean := coalesce((p->>'paid')::boolean, false);
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  if nullif(p->>'nfe_key', '') is not null and exists (select 1 from public.purchases where nfe_key = p->>'nfe_key') then
    raise exception 'Esta nota já foi importada.';
  end if;

  if nullif(p->'supplier'->>'cnpj', '') is not null then
    insert into public.suppliers (cnpj, name, email, phone)
    values (p->'supplier'->>'cnpj', coalesce(nullif(p->'supplier'->>'name', ''), 'Fornecedor'),
            nullif(p->'supplier'->>'email', ''), nullif(p->'supplier'->>'phone', ''))
    on conflict (cnpj) do update set name = excluded.name,
      email = coalesce(excluded.email, public.suppliers.email),
      phone = coalesce(excluded.phone, public.suppliers.phone)
    returning id into v_sup;
  elsif nullif(p->'supplier'->>'name', '') is not null then
    insert into public.suppliers (name) values (p->'supplier'->>'name') returning id into v_sup;
  end if;

  insert into public.purchases (supplier_id, nfe_key, number, series, issued_at, products_cents, freight_cents,
                                discount_cents, other_cents, total_cents, notes, xml)
  values (v_sup, nullif(p->>'nfe_key', ''), p->>'number', p->>'series', nullif(p->>'issued_at', '')::date,
          coalesce((p->>'products_cents')::int, 0), coalesce((p->>'freight_cents')::int, 0),
          coalesce((p->>'discount_cents')::int, 0), coalesce((p->>'other_cents')::int, 0),
          coalesce((p->>'total_cents')::int, 0), nullif(p->>'notes', ''), p->>'xml')
  returning id into v_pur;

  v_label := 'NF ' || coalesce(p->>'number', '?') || coalesce(' — ' || nullif(p->'supplier'->>'name', ''), '');

  for v_item in select * from jsonb_array_elements(coalesce(p->'items', '[]'::jsonb)) loop
    v_units := round(coalesce((v_item->>'qty')::numeric, 0) * coalesce(nullif((v_item->>'multiplier')::numeric, 0), 1))::int;
    insert into public.purchase_items (purchase_id, product_id, supplier_code, ean, description, ncm, unit, qty,
                                       multiplier, units_in, unit_cost_cents, total_cents)
    values (v_pur, nullif(v_item->>'product_id', '')::uuid, v_item->>'supplier_code', nullif(v_item->>'ean', ''),
            coalesce(v_item->>'description', ''), v_item->>'ncm', v_item->>'unit',
            coalesce((v_item->>'qty')::numeric, 0), coalesce(nullif((v_item->>'multiplier')::numeric, 0), 1),
            case when nullif(v_item->>'product_id', '') is null then 0 else v_units end,
            (v_item->>'unit_cost_cents')::int, coalesce((v_item->>'total_cents')::int, 0));

    if nullif(v_item->>'product_id', '') is not null then
      -- Lembra o vínculo pra próxima nota do mesmo fornecedor
      if v_sup is not null and nullif(v_item->>'supplier_code', '') is not null then
        insert into public.supplier_product_map (supplier_id, supplier_code, product_id, multiplier)
        values (v_sup, v_item->>'supplier_code', (v_item->>'product_id')::uuid,
                coalesce(nullif((v_item->>'multiplier')::numeric, 0), 1))
        on conflict (supplier_id, supplier_code) do update
          set product_id = excluded.product_id, multiplier = excluded.multiplier;
      end if;

      -- Custo médio ponderado
      select stock_qty, cost_cents into v_old_qty, v_old_cost from public.products
        where id = (v_item->>'product_id')::uuid for update;
      v_new_cost := (v_item->>'unit_cost_cents')::int;
      if v_new_cost is not null and v_old_cost is not null and coalesce(v_old_qty, 0) > 0 and v_units > 0 then
        v_new_cost := round((v_old_qty::numeric * v_old_cost + v_units::numeric * v_new_cost) / (v_old_qty + v_units))::int;
      end if;

      perform set_config('bodyoga.stock_reason', 'entrada', true);
      perform set_config('bodyoga.stock_note', v_label, true);
      -- Produto que ainda não controlava quantidade passa a controlar a partir desta entrada.
      update public.products
        set stock_qty = coalesce(stock_qty, 0) + v_units,
            cost_cents = coalesce(v_new_cost, cost_cents)
        where id = (v_item->>'product_id')::uuid;
      perform set_config('bodyoga.stock_reason', '', true);
      perform set_config('bodyoga.stock_note', '', true);
    end if;
  end loop;

  -- Contas a pagar (duplicatas da nota)
  for v_pay, v_n in select * from jsonb_array_elements(coalesce(p->'payables', '[]'::jsonb)) with ordinality loop
    insert into public.fin_entries (kind, description, category_id, amount_cents, due_date, competence_date, paid_at,
                                    counterparty, supplier_id, purchase_id, source, installment, external_ref)
    values ('despesa', v_label || coalesce(' (' || nullif(v_pay->>'installment', '') || ')', ''),
            public.fin_cat('mercadorias'), (v_pay->>'amount_cents')::int, (v_pay->>'due_date')::date,
            coalesce(nullif(p->>'issued_at', '')::date, current_date),
            case when v_paid then coalesce(nullif(p->>'issued_at', '')::date, current_date) end,
            p->'supplier'->>'name', v_sup, v_pur, 'compra', nullif(v_pay->>'installment', ''),
            'purchase:' || v_pur || ':' || v_n);
  end loop;

  return v_pur;
end; $$;
grant execute on function public.admin_import_purchase(jsonb) to authenticated;

-- ============ CMV por mês (custo gravado no item na hora da venda) ============
create or replace function public.fin_cmv(p_from date, p_to date)
returns table(month date, cmv_cents bigint, items_without_cost bigint)
language sql stable security definer set search_path = public as $$
  select date_trunc('month', coalesce(o.paid_at, o.created_at))::date as month,
         coalesce(sum((i->>'qty')::int * (i->>'unit_cost_cents')::int) filter (where i ? 'unit_cost_cents'), 0)::bigint,
         count(*) filter (where not (i ? 'unit_cost_cents'))::bigint
  from public.orders o, jsonb_array_elements(o.items) i
  where public.is_admin()
    and o.status in ('confirmed', 'shipped', 'completed')
    and coalesce(o.paid_at, o.created_at)::date between p_from and p_to
  group by 1 order by 1
$$;
grant execute on function public.fin_cmv(date, date) to authenticated;
