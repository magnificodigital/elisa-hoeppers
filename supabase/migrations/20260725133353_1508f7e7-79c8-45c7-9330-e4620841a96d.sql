
INSERT INTO public.app_settings (key, value, category, is_secret, label, description, display_order)
VALUES
  ('seo_default_title', 'BODYOGA — Corpo, mente e ambiente em equilíbrio', 'seo', false, 'Título padrão', 'Título usado nas páginas que não têm título próprio (aparece na aba do navegador e no Google).', 10),
  ('seo_default_description', 'Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente.', 'seo', false, 'Descrição padrão', 'Meta description usada quando a página não define a sua. Ideal entre 120–160 caracteres.', 20),
  ('seo_default_keywords', 'bodyoga, aromaterapia, rituais, bem-estar, óleos essenciais, corpo mente ambiente', 'seo', false, 'Palavras-chave', 'Lista separada por vírgula. Ajuda ferramentas de análise a entender o tema do site.', 30),
  ('seo_default_og_image', '', 'seo', false, 'Imagem de compartilhamento (OG)', 'URL absoluta da imagem exibida quando o site é compartilhado em redes sociais e WhatsApp. Recomendado 1200×630px.', 40),
  ('seo_author', 'Elisa Hoeppers Casas', 'seo', false, 'Autor / Marca', 'Nome que aparece em metadados de autoria e schema.org.', 50),
  ('seo_robots', 'index, follow', 'seo', false, 'Diretiva robots', 'Instrução para buscadores. Use "index, follow" para site público ou "noindex, nofollow" para bloquear indexação.', 60),
  ('seo_ga_id', '', 'seo', false, 'Google Analytics (GA4) ID', 'ID de medição do Google Analytics 4 (formato G-XXXXXXX). Deixe em branco para desativar.', 70),
  ('seo_gtm_id', '', 'seo', false, 'Google Tag Manager ID', 'ID do container GTM (formato GTM-XXXXXX). Deixe em branco para desativar.', 80),
  ('seo_gsc_verification', '', 'seo', false, 'Google Search Console (verificação)', 'Código de verificação do Google Search Console (apenas o valor do content="..." da meta tag).', 90)
ON CONFLICT (key) DO NOTHING;
