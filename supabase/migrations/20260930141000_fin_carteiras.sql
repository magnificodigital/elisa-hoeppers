-- Apple Pay / Google Pay = cartão (dinheiro cai depois). Só PIX é recebimento na hora.
create or replace function public.orders_fin_entries()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_paid boolean := new.status in ('confirmed', 'shipped', 'completed');
  v_was_paid boolean := tg_op = 'UPDATE' and old.status in ('confirmed', 'shipped', 'completed');
  v_day date := coalesce(new.paid_at, now())::date;
  v_card boolean := coalesce(new.payment_method_type, '') not ilike '%pix%' and coalesce(new.payment_method_type, '') <> '';
  v_card_days int := coalesce((select nullif(value, '')::int from public.app_settings where key = 'fin_card_days'), 30);
  v_has_entries boolean;
begin
  if v_paid and not v_was_paid then
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
