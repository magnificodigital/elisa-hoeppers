create or replace function public.claim_guest_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if auth.uid() is null then return 0; end if;

  with me as (
    select email from auth.users where id = auth.uid()
  )
  update public.orders o
  set user_id = auth.uid()
  from me
  where o.user_id is null
    and lower(o.customer_email) = lower(me.email);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.claim_guest_orders() to authenticated;