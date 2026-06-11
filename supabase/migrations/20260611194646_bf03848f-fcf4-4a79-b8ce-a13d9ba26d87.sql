-- brand em products
alter table public.products add column if not exists brand text;
create index if not exists idx_products_brand on public.products(brand) where brand is not null;

-- tags em posts
alter table public.posts add column if not exists tags jsonb default '[]'::jsonb;

-- Insere 3 produtos BODYOGA
insert into public.products (
  slug, name, short_description, description, price_cents,
  in_stock, is_active, is_featured, gallery, category, display_order,
  brand, weight_g, length_cm, width_cm, height_cm
) values
(
  'spray-antisseptico-bodyoga',
  'Spray Antisséptico — Ritual de Purificação',
  'Spray antisséptico botânico 60ml para mãos, pés e mat. Lavanda, Mandarina Verde, Patchouli.',
  E'Um ritual de purificação. Spray antisséptico botânico para mãos, pés e mat — limpa, protege e seca rapidamente sem ressecar a pele.\n\nCom óleos essenciais de Lavanda, Mandarina Verde e Patchouli, que promovem bem-estar, frescor e equilíbrio.\n\nBenefícios:\n• Antisséptico: limpa e protege\n• Seca rapidamente sem ressecar\n• Hidrata suavemente\n• Aroma aromaterapêutico\n• Ideal para yoga e rotina diária\n\nFórmula vegana · Não testado em animais · Embalagem reciclável.\n\nMODO DE USAR: Borrife nas mãos, pés ou mat sempre que desejar renovar e purificar seu ritual.',
  4900,
  true, true, true,
  jsonb_build_array(
    jsonb_build_object('url', '/images/bodyoga/spray-antisseptico-hero.jpg', 'alt', 'Spray Antisséptico BODYOGA'),
    jsonb_build_object('url', '/images/bodyoga/spray-antisseptico-detalhe.jpg', 'alt', 'Spray Antisséptico — Frente e verso')
  ),
  'BODYOGA',
  1,
  'bodyoga',
  120, 4.5, 4.5, 14
),
(
  'spray-aromatico-ambiente-bodyoga',
  'Spray Aromático — Ritual de Ambiente',
  'Spray aromático 100ml para ambientes. Lavanda, Mandarina Verde, Gerânio, Patchouli.',
  E'Um ritual de ambiente. Spray aromático para purificar o espaço e retornar para si.\n\nCom óleos essenciais que acolhem, equilibram e harmonizam:\n• Lavanda — Acalma a mente, reduz o estresse, traz tranquilidade\n• Mandarina Verde — Revitaliza, traz leveza e alegria\n• Gerânio — Equilibra as emoções, harmoniza corpo, mente e ambiente\n• Patchouli — Aterra, traz profundidade, promove sensação de acolhimento\n\nSem corantes artificiais · Livre de parabenos · Frasco reciclável.\n\nUm ritual para equilibrar corpo, mente e ambiente.',
  7900,
  true, true, true,
  jsonb_build_array(
    jsonb_build_object('url', '/images/bodyoga/spray-ambiente-hero.jpg', 'alt', 'Spray Aromático de Ambiente BODYOGA'),
    jsonb_build_object('url', '/images/bodyoga/spray-ambiente-rotulo.jpg', 'alt', 'Spray Aromático — Rótulo')
  ),
  'BODYOGA',
  2,
  'bodyoga',
  180, 5, 5, 16
),
(
  'sabonete-ritual-banho-bodyoga',
  'Sabonete Natural — Ritual do Banho',
  'Sabonete artesanal 100% natural com óleos essenciais. Vegano e cruelty free.',
  E'Um ritual sensorial para limpar, hidratar e reconectar corpo e mente.\n\nSabonete artesanal feito com ingredientes vegetais puros e óleos essenciais naturais.\n\n• Espuma cremosa · limpeza suave · aroma terapêutico\n• Feito à mão em pequenos lotes por Elisa Hoeppers Casas\n• Para todos os tipos de pele · uso diário\n\nCOMPOSIÇÃO: Azeite de oliva, óleo de coco, óleo de mamona, óleos essenciais, aveia coloidal, manteiga de karité.\n\n100% natural · Vegano · Cruelty free.',
  3800,
  true, true, true,
  jsonb_build_array(
    jsonb_build_object('url', '/images/bodyoga/sabonete-hero.jpg', 'alt', 'Sabonete Ritual do Banho BODYOGA'),
    jsonb_build_object('url', '/images/bodyoga/sabonete-rotulo.jpg', 'alt', 'Sabonete — Rótulo e detalhes')
  ),
  'BODYOGA',
  3,
  'bodyoga',
  150, 7, 5, 3
)
on conflict (slug) do nothing;