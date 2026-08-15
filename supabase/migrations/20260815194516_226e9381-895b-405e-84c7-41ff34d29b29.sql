INSERT INTO public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
SELECT 
  'BODYOGA', 
  'bodyoga', 
  'active', 
  true, 
  '[{"id": "hero-1", "type": "home-hero", "props": {}}, {"id": "opening-1", "type": "home-opening", "props": {"title": "Equilíbrio para o corpo,\nmente e ambiente.", "icon": "/assets/bodyoga/icone-bodyoga-2.png"}}, {"id": "products-1", "type": "products", "props": {"columns": 3, "selection": "all"}}, {"id": "intro-1", "type": "home-intro", "props": {"title": "BODYOGA é a\nfusão entre *yoga* e\ncuidado consciente.", "p1": "Cada produto é um ritual pensado pra trazer presença ao gesto cotidiano de cuidar de si.", "p2": "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente.", "ctaLabel": "Harmonia & Equilíbrio", "ctaHref": "/p/sobre", "image": "/images/home/bodyoga/bodyoga-left.png"}}, {"id": "blog-1", "type": "home-blog", "props": {}}, {"id": "insta-1", "type": "home-insta", "props": {}}]'::jsonb,
  'BODYOGA — Corpo, mente e ambiente em equilíbrio',
  'Cosméticos naturais artesanais com óleos essenciais, criados à mão por Elisa Hoeppers Casas.'
WHERE NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'bodyoga');