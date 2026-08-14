INSERT INTO public.app_settings (key, value, category, label, description, display_order)
VALUES 
  ('ritual_corpo_label', 'Corpo', 'site', 'Nome da Categoria: Corpo', 'Altere o nome exibido para a categoria Corpo.', 200),
  ('ritual_mente_label', 'Mente', 'site', 'Nome da Categoria: Mente', 'Altere o nome exibido para a categoria Mente.', 210),
  ('ritual_ambiente_label', 'Ambiente', 'site', 'Nome da Categoria: Ambiente', 'Altere o nome exibido para a categoria Ambiente.', 220)
ON CONFLICT (key) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description;
