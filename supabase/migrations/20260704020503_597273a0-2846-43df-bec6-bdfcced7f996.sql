
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
  -- operações sem usuário logado = service role (webhooks/admin edge function): permite
  if auth.uid() is null then
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
  -- operações sem usuário logado = service role (webhook de pagamento): permite
  if auth.uid() is null then
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
