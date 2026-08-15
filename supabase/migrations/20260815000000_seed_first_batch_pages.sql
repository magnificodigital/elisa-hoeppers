-- Batch 1: sobre, perfumista, bio

-- Page: sobre
insert into public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
select 
  'Sobre', 
  'sobre', 
  'active', 
  true, 
  '[
    {
      "id": "sobre-hero",
      "type": "image-text",
      "props": {
        "title": "Elisa Hoeppers — Yoga e Cuidado Consciente",
        "content": "Sou professora de Hatha e Vinyasa Yoga. Iniciei a prática pessoal há 18 anos.\nEm 2014, quando estive na Índia, no Ashram da Amma, iniciei o aprofundamento no estudo das técnicas de Yoga. Desde então, passei a me dedicar também à disseminação do Yoga.\n\nObtive minha primeira formação em yoga para crianças e adolescentes e continuei com cursos de Hatha e Vinyasa, além de outros como didática aplicada ao Yoga e Yogaterapia.\n\nVejo o Yoga como uma ferramenta para desenvolver respeito e carinho consigo mesma e com os outros, lapidar o ser humano em sua essência e reduzir o sofrimento.",
        "image": "/images/home/bio/elisa-perfil.png",
        "buttonLabel": "AGENDE SUA AULA",
        "buttonHref": "/agende-sua-aula",
        "side": "right"
      }
    }
  ]'::jsonb,
  'Sobre — Elisa Hoeppers',
  'Conheça Elisa Hoeppers: professora de Hatha e Vinyasa Yoga há 18 anos, formada também em yoga para crianças e adolescentes e em yogaterapia.'
where not exists (select 1 from public.pages where slug = 'sobre');

-- Page: perfumista
insert into public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
select 
  'Perfumista', 
  'perfumista', 
  'active', 
  true, 
  '[
    {
      "id": "perfumista-hero",
      "type": "image-text",
      "props": {
        "title": "perfumista",
        "content": "Composições autorais que nascem da fusão entre natureza, memória, identidade e alma.",
        "image": "/images/home/oleos/oleos-elisa.jpeg",
        "buttonLabel": "Descubra sua essência",
        "buttonHref": "/loja",
        "side": "right"
      }
    },
    {
      "id": "perfumista-bio",
      "type": "text",
      "props": {
        "content": "Desde a infância, meu mundo sempre foi guiado pelos sentidos. Cresci em meio à terra, às frutas e aos aromas da natureza, onde o olfato se tornou um elo invisível entre memórias e emoções. Esse instinto me levou à gastronomia, onde aprendi que sabores e cheiros compartilham a mesma linguagem: equilíbrio.\n\nMinha busca pelo conhecimento me levou a estudar aromaterapia, perfumaria geral, botânica e blending olfativo, explorando a essência das matérias-primas e o impacto dos aromas na mente e no corpo. Foi nesse caminho que aprofundei minha formação em perfumaria, unindo técnica e sensibilidade para transformar essências em narrativas únicas.\n\nHoje, cada criação minha nasce dessa fusão entre natureza, memória, composição e identidade. O perfume não é apenas um detalhe — ele dá alma aos espaços, presença às pessoas e eterniza os momentos.",
        "align": "center"
      }
    },
    {
      "id": "perfumista-cta",
      "type": "cta",
      "props": {
        "title": "Vamos criar a sua?",
        "text": "Composições personalizadas, sob medida. Fale comigo no WhatsApp pra entender o seu universo.",
        "buttonLabel": "Falar no WhatsApp",
        "buttonHref": "https://wa.me/5511994061178",
        "bgColor": "primary"
      }
    }
  ]'::jsonb,
  'Elisa Casas — perfumista',
  'Perfumaria autoral por Elisa Casas. Composições que nascem da fusão entre natureza, memória e identidade.'
where not exists (select 1 from public.pages where slug = 'perfumista');

-- Page: bio
insert into public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
select 
  'Bio', 
  'bio', 
  'active', 
  false, 
  '[
    {
      "id": "bio-block",
      "type": "author",
      "props": {
        "title": "Elisa Hoeppers Casas",
        "bio": "Fundadora do @bodyoga__ ®️ · Professora de YOGA · Aromaterapia com óleos essenciais · Alquimia olfativa",
        "photo": "/images/home/instagram/round-2.png"
      }
    },
    {
      "id": "bio-links",
      "type": "text",
      "props": {
        "content": "• Site oficial: /\n• Agende sua aula: /agende-sua-aula\n• Aulas online: /cursos\n• BODYOGA: /cursos/bodyoga-ao-vivo\n• Ver produtos: /loja\n• Elisa Casas — perfumista: /perfumista",
        "align": "center"
      }
    }
  ]'::jsonb,
  'Elisa Hoeppers — bio',
  'Fundadora do BODYOGA · Professora de YOGA · Aromaterapia e perfumaria. Acesse meus links.'
where not exists (select 1 from public.pages where slug = 'bio');
