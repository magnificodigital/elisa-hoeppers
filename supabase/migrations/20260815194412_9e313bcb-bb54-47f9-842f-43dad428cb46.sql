-- Agende sua Aula
INSERT INTO public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
SELECT 
  'Agende sua aula', 
  'agende-sua-aula', 
  'active', 
  true, 
  '[{"id": "booking-1", "type": "booking-form", "props": {}}]'::jsonb,
  'Agende sua aula — Elisa Hoeppers',
  'Reserve sua aula de yoga particular ou em grupo com Elisa Hoeppers, presencial ou online.'
WHERE NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'agende-sua-aula');

-- Cadastro de Alunos
INSERT INTO public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
SELECT 
  'Cadastro de alunos', 
  'cadastro-de-alunos', 
  'active', 
  false, 
  '[{"id": "signup-1", "type": "signup-form", "props": {}}]'::jsonb,
  'Cadastro de alunos — Elisa Hoeppers',
  'Acesse aulas e matricule-se nos cursos da Elisa.'
WHERE NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'cadastro-de-alunos');

-- Projetos Personalizados
INSERT INTO public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
SELECT 
  'Projetos Personalizados', 
  'projetos-personalizados', 
  'active', 
  true, 
  '[{"id": "hero-1", "type": "hero", "props": {"title": "Projetos sob medida", "subtitle": "Fragrâncias exclusivas e brindes personalizados para sua empresa ou evento.", "bgImage": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80", "overlay": 0.4}}, {"id": "form-1", "type": "custom-project-form", "props": {}}]'::jsonb,
  'Projetos Sob Medida | BODYOGA',
  'Fragrâncias exclusivas e brindes personalizados para sua empresa ou evento.'
WHERE NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'projetos-personalizados');