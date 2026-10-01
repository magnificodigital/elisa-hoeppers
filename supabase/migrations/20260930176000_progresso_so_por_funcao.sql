-- Progresso de aula só pela função mark_lesson_complete (que confere matrícula); sem gravação direta.
drop policy if exists "progress_insert_own" on public.lesson_progress;
drop policy if exists "progress_update_own" on public.lesson_progress;
