DROP FUNCTION IF EXISTS public.get_order_by_code(text);

CREATE FUNCTION public.get_order_by_code(p_code text)
 RETURNS TABLE(id uuid, user_id uuid, code text, customer_name text, items jsonb, subtotal_cents integer, shipping_cents integer, total_cents integer, status order_status, tracking_code text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select o.id, o.user_id, o.code, o.customer_name, o.items, o.subtotal_cents, o.shipping_cents, o.total_cents, o.status, o.tracking_code, o.created_at
  from public.orders o
  where o.code = p_code;
end;
$function$;