INSERT INTO public.app_settings (key, value, category, is_secret, label, description, display_order)
VALUES 
  ('home_custom_projects_title', 'Sua marca tem um cheiro.', 'home', false, 'Título - Projetos Personalizados', 'Título da seção de projetos sob medida na home.', 100),
  ('home_custom_projects_subtitle', 'Vamos criá-lo juntos.', 'home', false, 'Subtítulo - Projetos Personalizados', 'Texto de apoio da seção de projetos sob medida na home.', 110),
  ('home_custom_projects_cta', 'Solicitar projeto', 'home', false, 'Texto do Botão - Projetos Personalizados', 'Texto que aparece no botão de projetos na home.', 120)
ON CONFLICT (key) DO UPDATE SET 
  category = EXCLUDED.category,
  label = EXCLUDED.label,
  description = EXCLUDED.description;

GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
