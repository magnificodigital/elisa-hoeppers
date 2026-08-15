
-- Batch 1: sobre, perfumista, bio, privacidade, termos

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

-- Page: privacidade
insert into public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
select 
  'Privacidade', 
  'privacidade', 
  'active', 
  false, 
  '[
    {
      "id": "privacidade-text",
      "type": "text",
      "props": {
        "title": "Política de Privacidade",
        "content": "Última atualização: 28 de maio de 2026\n\nEste site é operado por Elisa Hoeppers Casas, profissional autônoma de yoga e aromaterapia, com endereço comercial na Rua Itapolis 818, Pacaembu, São Paulo/SP. Para qualquer dúvida sobre privacidade, entre em contato por elisa.hoeppers@gmail.com ou WhatsApp +55 11 99406-1178.\n\n1. Dados que coletamos\nColetamos apenas o necessário pra prestar nossos serviços e responder você:\n- Cadastro de aluna: nome e e-mail.\n- Agendamento de aula: nome, e-mail, telefone, mensagem opcional.\n- Compra na loja: nome, e-mail, telefone e, opcionalmente, endereço de entrega.\n- Pagamento online: processado diretamente pelo Mercado Pago. Não armazenamos dados de cartão.\n- Newsletter: e-mail e nome opcional.\n- Cookies de sessão: pra manter você logada.\n- Cookies analíticos: só ativos após seu consentimento, pra entender uso geral do site.\n\n2. Como usamos seus dados\n- Prestar os serviços contratados (aulas, cursos, produtos).\n- Enviar confirmação de reservas e pedidos por e-mail e WhatsApp.\n- Enviar a newsletter (somente se você se inscrever).\n- Cumprir obrigações legais (fiscais, contábeis).\n- Melhorar o site com dados agregados de uso.\n\n3. Com quem compartilhamos\n- Supabase — banco de dados onde ficam suas informações.\n- Mercado Pago — processa pagamentos online.\n- Resend — envia nossos e-mails transacionais.\n- YouTube — quando você assiste vídeos das aulas.\n- Cloudflare — infraestrutura de hospedagem.\nNão vendemos nem compartilhamos seus dados pra marketing de terceiros.\n\n4. Cookies\nUsamos cookies pra:\n- Manter você logada (essencial).\n- Lembrar itens no carrinho (essencial).\n- Salvar suas preferências de consentimento.\n- Analisar uso geral do site (opcional — só com seu aceite).\n\n5. Seus direitos (LGPD)\nVocê pode, a qualquer momento:\n- Acessar, corrigir ou apagar seus dados;\n- Solicitar portabilidade;\n- Revogar consentimento (newsletter, cookies analíticos);\n- Reclamar à ANPD.\nPra exercer qualquer um, escreva pra elisa.hoeppers@gmail.com.\n\n6. Retenção de dados\nMantemos seus dados enquanto sua conta estiver ativa ou enquanto for necessário pra cumprir obrigações legais. Você pode pedir a exclusão a qualquer momento.\n\n7. Alterações\nEsta política pode ser atualizada. Mudanças relevantes serão comunicadas por e-mail ou na sua próxima visita.",
        "align": "left"
      }
    }
  ]'::jsonb,
  'Política de Privacidade — Elisa Hoeppers',
  'Como coletamos, usamos e protegemos seus dados pessoais em conformidade com a LGPD no site da Elisa Hoeppers.'
where not exists (select 1 from public.pages where slug = 'privacidade');

-- Page: termos
insert into public.pages (title, slug, status, in_menu, content_blocks, seo_title, seo_description)
select 
  'Termos de Uso', 
  'termos', 
  'active', 
  false, 
  '[
    {
      "id": "termos-text",
      "type": "text",
      "props": {
        "title": "Termos de Uso",
        "content": "Última atualização: 28 de maio de 2026\n\nAo usar este site, você concorda com estes Termos e com a nossa Política de Privacidade. Se não concorda, por favor não use o site.\n\n1. Sobre o serviço\nO site é operado por Elisa Hoeppers Casas, profissional autônoma. Oferecemos aulas de yoga, cursos online, produtos de aromaterapia e materiais relacionados.\n\n2. Conta e acesso\n- Você deve ter 18+ anos ou ter consentimento dos responsáveis.\n- Suas credenciais são pessoais e intransferíveis.\n- Você é responsável por todas as atividades feitas com sua conta.\n\n3. Agendamento de aulas\n- Reservas ficam pendentes até confirmação pela Elisa via WhatsApp.\n- O pagamento pode ser combinado por WhatsApp/PIX ou feito online via Mercado Pago.\n- Cancelamentos com pelo menos 24h de antecedência são reembolsáveis. Cancelamentos depois disso ficam a critério da Elisa.\n- Faltas sem aviso prévio não são reembolsadas.\n\n4. Cursos online\n- Após matrícula, você tem acesso vitalício ao conteúdo enquanto o curso estiver disponível.\n- O conteúdo é pessoal e intransferível. Compartilhar credenciais ou conteúdo gera cancelamento da matrícula sem reembolso.\n- Vídeos hospedados no YouTube como \"não listados\". Não baixe, redistribua nem use comercialmente.\n\n5. Loja e produtos\n- Preços e estoque podem mudar a qualquer momento.\n- Frete e prazo são combinados por WhatsApp após confirmação do pedido.\n- Trocas e devoluções: até 7 dias corridos após o recebimento (CDC art. 49), com o produto sem uso e na embalagem original.\n\n6. Pagamentos\nOs pagamentos online são processados pelo Mercado Pago. Não armazenamos dados de cartão. Pagamentos por PIX ou outros meios podem ser combinados por WhatsApp.\n\n7. Propriedade intelectual\nTodo o conteúdo (textos, vídeos, áudios, marcas, design) é de propriedade da Elisa Hoeppers Casas, exceto quando indicado. É proibida a reprodução, redistribuição ou uso comercial sem autorização escrita.\n\n8. Conteúdo do usuário\nAo usar a área de Perguntas & Respostas ou Avaliações, você concorda em manter um tom respeitoso. Mensagens ofensivas, spam ou conteúdo ilegal podem ser removidas a qualquer momento.\n\n9. Isenção de responsabilidade\nAs aulas de yoga e o uso de óleos essenciais são complementares ao tratamento médico, não o substituem. Consulte profissional de saúde para condições específicas. Não nos responsabilizamos por uso indevido das instruções.\n\n10. Alterações\nEstes Termos podem mudar. Mudanças relevantes serão comunicadas no site. O uso continuado significa aceite das mudanças.\n\n11. Lei aplicável\nEstes Termos são regidos pelas leis do Brasil. Fica eleito o foro de São Paulo/SP pra resolução de qualquer disputa, com renúncia a qualquer outro.",
        "align": "left"
      }
    }
  ]'::jsonb,
  'Termos de Uso — Elisa Hoeppers',
  'Termos e condições que regem o uso do site, agendamento de aulas, cursos online e compras na loja da Elisa Hoeppers.'
where not exists (select 1 from public.pages where slug = 'termos');
