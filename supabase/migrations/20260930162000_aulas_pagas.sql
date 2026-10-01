-- SEGURANÇA: aulas (youtube_id/conteúdo) de curso PAGO eram legíveis por qualquer visitante.
-- Agora: curso gratuito, aula de prévia gratuita, aluno matriculado ou equipe.
drop policy if exists "lessons_public_read" on public.lessons;
create policy "lessons_public_read" on public.lessons for select
  using (
    public.current_user_role() = any (array['instructor'::user_role, 'admin'::user_role])
    or exists (
      select 1 from public.courses c
       where c.id = lessons.course_id and c.is_published
         and (coalesce(c.price_cents, 0) = 0 or lessons.is_free_preview or public.is_enrolled(c.id))
    )
  );

-- Módulos de curso não publicado ficavam visíveis por uma política "true" duplicada.
drop policy if exists "modules_public_select" on public.modules;
