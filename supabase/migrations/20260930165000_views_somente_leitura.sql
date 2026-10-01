-- SEGURANÇA (crítico): views rodam como dono e são "auto-updatable" — visitante conseguia
-- alterar perguntas de quiz e mover/apagar agendamentos através delas.
revoke insert, update, delete, truncate on public.quiz_questions_public from anon, authenticated;
revoke insert, update, delete, truncate on public.taken_slots from anon, authenticated;
revoke insert, update, delete, truncate on public.my_course_progress from anon, authenticated;

-- Defesa extra: TRUNCATE não passa pelo RLS; ninguém fora do servidor precisa dele.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind = 'r' loop
    execute format('revoke truncate on public.%I from anon, authenticated', t.relname);
  end loop;
end $$;

-- Atenção: toda VIEW nova precisa de "revoke insert, update, delete on <view> from anon, authenticated"
-- (ou security_invoker=true), senão vira porta de escrita sem RLS.
