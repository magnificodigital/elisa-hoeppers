insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values
  ('behold_feed_url', '', 'site', false,
   'URL do feed Behold',
   'Cole a URL do feed JSON do Behold. Formato: https://feeds.behold.so/<feed-id>. Encontrada em Behold Dashboard → seu feed → API.',
   1),
  ('instagram_handle', 'bodyoga.ritual', 'site', false,
   'Handle do Instagram',
   'Handle sem @. Ex: bodyoga.ritual',
   2)
on conflict (key) do nothing;