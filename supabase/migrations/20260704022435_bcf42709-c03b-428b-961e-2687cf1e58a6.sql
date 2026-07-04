DROP FUNCTION IF EXISTS public.get_order_by_code(text, text);

CREATE OR REPLACE FUNCTION public.get_order_by_code(p_code text, p_email text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, user_id uuid, code text, customer_name text, items jsonb, subtotal_cents integer, shipping_cents integer, total_cents integer, status order_status, tracking_code text, payment_method_type text, payment_installments integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order record;
  v_user_id uuid := auth.uid();
begin
  select o.id, o.user_id, o.code, o.customer_name, o.customer_email, o.items,
         o.subtotal_cents, o.shipping_cents, o.total_cents, o.status, o.tracking_code,
         o.payment_method_type, o.payment_installments, o.created_at
    into v_order
    from public.orders o
    where o.code = p_code;

  if v_order.id is null then
    return;
  end if;

  if v_user_id is not null and v_order.user_id = v_user_id then
    return query select v_order.id, v_order.user_id, v_order.code, v_order.customer_name,
      v_order.items, v_order.subtotal_cents, v_order.shipping_cents, v_order.total_cents,
      v_order.status, v_order.tracking_code, v_order.payment_method_type, v_order.payment_installments, v_order.created_at;
    return;
  end if;

  if v_order.user_id is null then
    if p_email is null or lower(trim(p_email)) is distinct from lower(trim(v_order.customer_email)) then
      return;
    end if;
    return query select v_order.id, v_order.user_id, v_order.code, v_order.customer_name,
      v_order.items, v_order.subtotal_cents, v_order.shipping_cents, v_order.total_cents,
      v_order.status, v_order.tracking_code, v_order.payment_method_type, v_order.payment_installments, v_order.created_at;
    return;
  end if;

  return;
end;
$function$;