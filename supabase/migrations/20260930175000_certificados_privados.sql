-- LGPD: a lista inteira de certificados (nome da aluna + curso) era pública.
-- Agora: a dona e a equipe leem; verificação pública só pelo código exato (RPC).
drop policy if exists "certificates_select_public" on public.certificates;
create policy "certificates_select_own_or_staff" on public.certificates for select
  using (user_id = auth.uid() or public.current_user_role() = any (array['instructor'::user_role, 'admin'::user_role]));

create or replace function public.verify_certificate(p_code text)
returns setof public.certificates language sql stable security definer set search_path = public as $$
  select * from public.certificates where code = upper(trim(p_code)) limit 1
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;
