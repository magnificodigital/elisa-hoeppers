insert into public.app_settings (key, value, category, is_secret, label, description, display_order)
values
  ('me_allowed_services', '', 'melhorenvio', false,
'Transportadoras permitidas (IDs)',
'IDs separados por vírgula. Deixe vazio pra mostrar todas. Comuns: 1=Correios PAC, 2=Correios SEDEX, 3=JadLog Package, 4=JadLog Com, 7=Azul Cargo, 12=JadLog Hoje, 17=Loggi, 31=Mini Envios. Ex: 1,2',
17)
on conflict (key) do nothing;