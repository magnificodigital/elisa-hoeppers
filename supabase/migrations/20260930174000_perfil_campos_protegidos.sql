-- SEGURANÇA: cliente não pode alterar IDs de sistemas externos no próprio perfil; nome sem HTML.
create or replace function public.profiles_protect_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.full_name := nullif(regexp_replace(coalesce(new.full_name, ''), '[<>]', '', 'g'), '');
  new.phone := nullif(regexp_replace(coalesce(new.phone, ''), '[<>]', '', 'g'), '');
  if tg_op = 'UPDATE' and auth.uid() is not null
     and public.current_user_role() not in ('admin'::user_role, 'instructor'::user_role) then
    new.asaas_customer_id := old.asaas_customer_id;
    new.base_customer_id := old.base_customer_id;
  end if;
  return new;
end; $$;
drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields before insert or update on public.profiles
  for each row execute function public.profiles_protect_fields();
