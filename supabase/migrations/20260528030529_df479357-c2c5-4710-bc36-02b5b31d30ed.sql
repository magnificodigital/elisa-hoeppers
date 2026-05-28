create table public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text,
  body text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_questions_lesson_created_idx on public.lesson_questions (lesson_id, created_at desc);
create index lesson_questions_user_idx on public.lesson_questions (user_id);

grant select, insert, update, delete on public.lesson_questions to authenticated;
grant all on public.lesson_questions to service_role;

create trigger touch_lesson_questions before update on public.lesson_questions
  for each row execute procedure public.touch_updated_at();

create table public.lesson_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.lesson_questions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text,
  author_role public.user_role,
  body text not null,
  created_at timestamptz not null default now()
);
create index lesson_answers_question_created_idx on public.lesson_answers (question_id, created_at);

grant select, insert, delete on public.lesson_answers to authenticated;
grant all on public.lesson_answers to service_role;

alter table public.lesson_questions enable row level security;
alter table public.lesson_answers enable row level security;

create or replace function public.is_enrolled_in_lesson(p_lesson_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.lessons l
    join public.enrollments e on e.course_id = l.course_id
    where l.id = p_lesson_id
      and e.user_id = auth.uid()
      and e.status = 'active'
  );
$$;

create policy "questions_read_enrolled_or_staff" on public.lesson_questions
  for select using (
    public.is_enrolled_in_lesson(lesson_id)
    or public.current_user_role() in ('instructor','admin')
  );

create policy "questions_insert_enrolled" on public.lesson_questions
  for insert with check (
    user_id = auth.uid()
    and (
      public.is_enrolled_in_lesson(lesson_id)
      or public.current_user_role() in ('instructor','admin')
    )
  );

create policy "questions_update_own_or_staff" on public.lesson_questions
  for update using (
    user_id = auth.uid() or public.current_user_role() in ('instructor','admin')
  ) with check (
    user_id = auth.uid() or public.current_user_role() in ('instructor','admin')
  );

create policy "questions_delete_own_or_staff" on public.lesson_questions
  for delete using (
    user_id = auth.uid() or public.current_user_role() in ('instructor','admin')
  );

create policy "answers_read_if_question_visible" on public.lesson_answers
  for select using (
    exists (
      select 1 from public.lesson_questions q
      where q.id = lesson_answers.question_id
        and (
          public.is_enrolled_in_lesson(q.lesson_id)
          or public.current_user_role() in ('instructor','admin')
        )
    )
  );

create policy "answers_insert_enrolled" on public.lesson_answers
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.lesson_questions q
      where q.id = lesson_answers.question_id
        and (
          public.is_enrolled_in_lesson(q.lesson_id)
          or public.current_user_role() in ('instructor','admin')
        )
    )
  );

create policy "answers_delete_own_or_staff" on public.lesson_answers
  for delete using (
    user_id = auth.uid() or public.current_user_role() in ('instructor','admin')
  );