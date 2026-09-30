-- SEGURANÇA: qualquer conta de cliente podia enviar, substituir e APAGAR imagens da loja (bucket media).
-- Gravação agora só para admin/instrutor. Leitura continua pública (vitrine).
drop policy if exists "media_auth_insert" on storage.objects;
drop policy if exists "media_auth_update" on storage.objects;
drop policy if exists "media_auth_delete" on storage.objects;

create policy "media_staff_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.current_user_role() in ('admin'::public.user_role, 'instructor'::public.user_role));
create policy "media_staff_update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.current_user_role() in ('admin'::public.user_role, 'instructor'::public.user_role));
create policy "media_staff_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.current_user_role() in ('admin'::public.user_role, 'instructor'::public.user_role));
