-- SEGURANÇA: reserva pública sempre entra como 'pending', com quantidade 1–20 e sem HTML.
create or replace function public.product_reservations_sanitize()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and public.current_user_role() in ('admin'::user_role, 'instructor'::user_role) then
    return new;
  end if;
  new.status := 'pending';
  new.quantity := least(greatest(coalesce(new.quantity, 1), 1), 20);
  new.customer_name := nullif(regexp_replace(coalesce(new.customer_name, ''), '[<>]', '', 'g'), '');
  new.customer_phone := nullif(regexp_replace(coalesce(new.customer_phone, ''), '[<>]', '', 'g'), '');
  new.notes := nullif(left(regexp_replace(coalesce(new.notes, ''), '[<>]', '', 'g'), 1000), '');
  return new;
end; $$;
drop trigger if exists product_reservations_sanitize on public.product_reservations;
create trigger product_reservations_sanitize before insert on public.product_reservations
  for each row execute function public.product_reservations_sanitize();
