CREATE OR REPLACE FUNCTION public.admin_list_customers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  with emails as (
    select lower(u.email) as email,
           u.id as user_id,
           p.full_name,
           p.phone,
           p.created_at as account_created_at
    from auth.users u
    join public.profiles p on p.id = u.id
    where u.email is not null

    union

    select lower(o.customer_email) as email,
           null::uuid as user_id,
           null::text as full_name,
           null::text as phone,
           null::timestamptz as account_created_at
    from public.orders o
    where o.customer_email is not null
      and lower(o.customer_email) not in (
        select lower(email) from auth.users where email is not null
      )
  ),
  base as (
    select distinct on (email) email, user_id, full_name, phone, account_created_at
    from emails
    order by email, user_id nulls last
  ),
  order_stats as (
    select lower(customer_email) as email,
           count(*)::int as orders_count,
           coalesce(sum(total_cents) filter (where status in ('confirmed','shipped','completed')), 0)::bigint as total_spent_cents,
           max(created_at) as last_order_at,
           (array_agg(customer_name order by created_at desc))[1] as last_order_name
    from public.orders
    where customer_email is not null
    group by lower(customer_email)
  )
  select coalesce(jsonb_agg(t order by t->>'last_activity' desc nulls last), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'email', b.email,
      'name', coalesce(nullif(b.full_name, ''), os.last_order_name),
      'phone', b.phone,
      'has_account', b.user_id is not null,
      'account_created_at', b.account_created_at,
      'orders_count', coalesce(os.orders_count, 0),
      'total_spent_cents', coalesce(os.total_spent_cents, 0),
      'last_order_at', os.last_order_at,
      'subscribed', exists (
        select 1 from public.newsletter_subscribers ns
        where lower(ns.email) = b.email and ns.unsubscribed_at is null
      ),
      'enrolled', b.user_id is not null and exists (
        select 1 from public.enrollments e
        where e.user_id = b.user_id and e.status = 'active'
      ),
      'last_activity', greatest(coalesce(os.last_order_at, b.account_created_at), coalesce(b.account_created_at, os.last_order_at))
    ) as t
    from base b
    left join order_stats os on os.email = b.email
  ) s;

  return v_result;
end;
$function$;