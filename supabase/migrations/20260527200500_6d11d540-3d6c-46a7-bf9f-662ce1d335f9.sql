-- Adiciona snapshot do nome no review (pra mostrar publicamente sem violar RLS de profiles)
alter table public.course_reviews
  add column if not exists author_name text;

-- Backfill: copia do profile pra reviews já existentes
update public.course_reviews r
set author_name = p.full_name
from public.profiles p
where p.id = r.user_id and r.author_name is null;