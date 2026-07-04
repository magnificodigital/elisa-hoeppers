
-- FIX 1: prevent privilege escalation on profiles
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role public.user_role;
begin
  if old.role is not distinct from new.role then
    return new;
  end if;
  v_caller_role := public.current_user_role();
  if v_caller_role = 'admin' then
    return new;
  end if;
  new.role := old.role;
  return new;
end;
$$;

drop trigger if exists trg_prevent_privilege_escalation on public.profiles;
create trigger trg_prevent_privilege_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_privilege_escalation();

-- FIX 2: protect enrollment status transitions
create or replace function public.protect_enrollment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role public.user_role;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;
  v_caller_role := public.current_user_role();
  if v_caller_role in ('admin', 'instructor') then
    return new;
  end if;
  if old.status = 'pending_payment' and new.status = 'cancelled' then
    return new;
  end if;
  new.status := old.status;
  return new;
end;
$$;

drop trigger if exists trg_protect_enrollment_status on public.enrollments;
create trigger trg_protect_enrollment_status
  before update on public.enrollments
  for each row
  execute function public.protect_enrollment_status();

-- FIX 4: rewrite get_order_by_code with email confirmation for guests
create or replace function public.get_order_by_code(p_code text, p_email text default null)
returns table (
  id uuid,
  user_id uuid,
  code text,
  customer_name text,
  items jsonb,
  subtotal_cents int,
  shipping_cents int,
  total_cents int,
  status public.order_status,
  tracking_code text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order record;
  v_user_id uuid := auth.uid();
begin
  select o.id, o.user_id, o.code, o.customer_name, o.customer_email, o.items,
         o.subtotal_cents, o.shipping_cents, o.total_cents, o.status, o.tracking_code, o.created_at
    into v_order
    from public.orders o
    where o.code = p_code;

  if v_order.id is null then
    return;
  end if;

  -- Caso 1: logado e dono do pedido
  if v_user_id is not null and v_order.user_id = v_user_id then
    return query select v_order.id, v_order.user_id, v_order.code, v_order.customer_name,
      v_order.items, v_order.subtotal_cents, v_order.shipping_cents, v_order.total_cents,
      v_order.status, v_order.tracking_code, v_order.created_at;
    return;
  end if;

  -- Caso 2: pedido de convidado (sem user_id) exige email correto
  if v_order.user_id is null then
    if p_email is null or lower(trim(p_email)) is distinct from lower(trim(v_order.customer_email)) then
      return;
    end if;
    return query select v_order.id, v_order.user_id, v_order.code, v_order.customer_name,
      v_order.items, v_order.subtotal_cents, v_order.shipping_cents, v_order.total_cents,
      v_order.status, v_order.tracking_code, v_order.created_at;
    return;
  end if;

  -- Caso 3: pedido pertence a outro usuário
  return;
end;
$$;
