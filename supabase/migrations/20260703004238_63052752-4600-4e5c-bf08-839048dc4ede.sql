INSERT INTO public.bodyoga_slides (title, subtitle, cta_label, cta_href, image_url, display_order, is_active)
SELECT
  'Rituais para corpo,
mente e ambiente.',
  'Cosméticos naturais artesanais com óleos essenciais.
Criados à mão por Elisa Hoeppers Casas, no encontro
entre o yoga e o cuidado natural.',
  'Conhecer rituais',
  '#produtos',
  '/bodyoga-hero-default.jpg',
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.bodyoga_slides);