insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do update set public = true;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media_staff_insert') then
    create policy "media_staff_insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.current_user_role() = any (array['instructor'::user_role, 'admin'::user_role]));
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media_staff_update') then
    create policy "media_staff_update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.current_user_role() = any (array['instructor'::user_role, 'admin'::user_role]));
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media_staff_delete') then
    create policy "media_staff_delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.current_user_role() = any (array['instructor'::user_role, 'admin'::user_role]));
  end if;
end $$;