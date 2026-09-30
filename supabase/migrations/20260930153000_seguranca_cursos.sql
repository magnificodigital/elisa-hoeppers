-- SEGURANÇA: aluno logado conseguia criar/editar a própria matrícula com status 'active'
-- (acesso grátis a curso pago) e gravar tentativa de quiz aprovada (certificado falso).
-- Escrita agora só por funções do servidor; matrícula gratuita pela RPC abaixo.
drop policy if exists "enrollments_insert_self" on public.enrollments;
drop policy if exists "enrollments_update_own_or_staff" on public.enrollments;
create policy "enrollments_write_staff" on public.enrollments
  for all to authenticated
  using (public.current_user_role() = any (array['instructor'::user_role, 'admin'::user_role]))
  with check (public.current_user_role() = any (array['instructor'::user_role, 'admin'::user_role]));

drop policy if exists "quiz_attempts_insert_own" on public.quiz_attempts;

-- Matrícula gratuita: só em curso publicado e sem preço.
create or replace function public.enroll_free_course(p_course_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Você precisa estar logado para se matricular.'; end if;
  if not exists (select 1 from public.courses where id = p_course_id and is_published and coalesce(price_cents, 0) = 0) then
    raise exception 'Este curso não é gratuito.';
  end if;
  insert into public.enrollments (user_id, course_id, status)
  values (auth.uid(), p_course_id, 'active')
  on conflict do nothing;
end; $$;
revoke all on function public.enroll_free_course(uuid) from public, anon;
grant execute on function public.enroll_free_course(uuid) to authenticated;
