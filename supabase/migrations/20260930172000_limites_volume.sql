-- SEGURANÇA: limites de volume nos formulários/RPCs públicos (evita usar o site para bombardear
-- e-mails de terceiros, encher a newsletter de endereços falsos ou lotar o banco).
-- Admin/equipe e o próprio servidor não são limitados.
create or replace function public.throttle_public_inserts()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_col text := tg_argv[0];
  v_limit int := tg_argv[1]::int;
  v_count int;
begin
  if auth.uid() is not null and public.current_user_role() in ('admin'::user_role, 'instructor'::user_role) then
    return new;
  end if;
  if current_user in ('postgres', 'service_role', 'supabase_admin') and auth.uid() is null
     and coalesce(current_setting('request.jwt.claims', true), '') not like '%"role":"anon"%'
     and coalesce(current_setting('request.jwt.claims', true), '') not like '%"role":"authenticated"%' then
    return new; -- servidor (functions com chave de serviço, crons)
  end if;
  execute format('select count(*) from public.%I where %I > now() - interval ''1 hour''', tg_table_name, v_col)
    into v_count;
  if v_count >= v_limit then
    raise exception 'muitas solicitações no momento, tente novamente mais tarde';
  end if;
  return new;
end; $$;

drop trigger if exists throttle on public.orders;
create trigger throttle before insert on public.orders for each row execute function public.throttle_public_inserts('created_at', '60');
drop trigger if exists throttle on public.coupons;
create trigger throttle before insert on public.coupons for each row execute function public.throttle_public_inserts('created_at', '40');
drop trigger if exists throttle on public.newsletter_subscribers;
create trigger throttle before insert on public.newsletter_subscribers for each row execute function public.throttle_public_inserts('subscribed_at', '60');
drop trigger if exists throttle on public.product_waitlist;
create trigger throttle before insert on public.product_waitlist for each row execute function public.throttle_public_inserts('created_at', '60');
drop trigger if exists throttle on public.site_notice_leads;
create trigger throttle before insert on public.site_notice_leads for each row execute function public.throttle_public_inserts('created_at', '60');
drop trigger if exists throttle on public.custom_project_requests;
create trigger throttle before insert on public.custom_project_requests for each row execute function public.throttle_public_inserts('created_at', '30');
drop trigger if exists throttle on public.product_reservations;
create trigger throttle before insert on public.product_reservations for each row execute function public.throttle_public_inserts('created_at', '60');
drop trigger if exists throttle on public.appointments;
create trigger throttle before insert on public.appointments for each row execute function public.throttle_public_inserts('created_at', '40');

-- Por e-mail: no máximo 5 pedidos pendentes criados na última hora (evita usar e-mail alheio em massa).
create or replace function public.orders_throttle_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.orders
       where lower(customer_email) = lower(new.customer_email)
         and status = 'pending' and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'muitas solicitações no momento, tente novamente mais tarde';
  end if;
  return new;
end; $$;
drop trigger if exists throttle_email on public.orders;
create trigger throttle_email before insert on public.orders for each row execute function public.orders_throttle_email();
