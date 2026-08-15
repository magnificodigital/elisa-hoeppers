
UPDATE public.pages 
SET content_blocks = '[
  { "id": "b_hero",    "type": "home-hero",    "props": {} },
  { "id": "b_opening", "type": "home-opening", "props": { "title": "Equilíbrio para o corpo,\nmente e ambiente." } },
  { "id": "b_rituals", "type": "home-rituals", "props": {} },
  { "id": "b_intro",   "type": "home-intro",   "props": {
    "title": "BODYOGA é a\nfusão entre *yoga* e\ncuidado consciente.",
    "p1": "Cada produto é um ritual pensado pra trazer presença ao gesto cotidiano de cuidar de si.",
    "p2": "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente.",
    "ctaLabel": "Harmonia & Equilíbrio",
    "ctaHref": "/sobre",
    "image": "https://hoepppers.lovable.app/images/home/bodyoga/bodyoga-left.png"
  } },
  { "id": "b_blog",    "type": "home-blog",    "props": {} },
  { "id": "b_insta",   "type": "instagram",    "props": {} }
]'::jsonb
WHERE slug = 'home';
