export type TutorialStep = {
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
  tip?: string;
  warning?: string;
};

export type Tutorial = {
  id: string;
  title: string;
  description: string;
  category: "produtos" | "cursos" | "pedidos" | "clientes" | "marketing" | "config";
  estimatedMinutes: number;
  steps: TutorialStep[];
};

export const tutorials: Tutorial[] = [
  // ============ PRODUTOS ============
  {
    id: "cadastrar-produto",
    title: "Como cadastrar um produto novo",
    description: "Do zero: crie um produto na loja com fotos, preço e estoque.",
    category: "produtos",
    estimatedMinutes: 5,
    steps: [
      {
        title: "Acessar a página de produtos",
        body: "No menu lateral do admin, clique em **Produtos**. Você verá a lista de todos os produtos ativos e inativos.\n\nCada linha mostra: nome, preço, estoque e status (ativo/inativo). Você pode filtrar por categoria ou buscar por nome no campo de busca no topo.",
      },
      {
        title: "Criar novo produto",
        body: "Clique no botão **+ Novo produto** no canto superior direito. Você será redirecionada pra uma tela de edição vazia com todos os campos necessários pra criar o produto.",
      },
      {
        title: "Preencher informações básicas",
        body: "Preencha os campos principais:\n\n- **Nome**: título que aparece na loja pra cliente (ex: 'Spray Antisséptico Ritual de Purificação')\n- **Slug**: parte da URL depois de /loja/. Use minúsculas, hífens no lugar de espaço (ex: 'spray-antisseptico-ritual')\n- **Descrição curta**: 1-2 linhas que aparecem nos cards de listagem\n- **Descrição completa**: texto detalhado que aparece na página individual do produto",
        tip: "Escolha um slug curto e descritivo — depois de publicado, mudar o slug quebra links que clientes possam ter salvo. Se puder, deixa fixo desde o início.",
      },
      {
        title: "Adicionar fotos ao produto",
        body: "Na seção **Galeria**, clique em **+ Adicionar imagem** e cole a URL da foto hospedada.\n\nA primeira foto vira a **capa** — aparece nos cards de listagem e no topo da página do produto. As demais aparecem em carrossel na página.\n\nRecomendação: **fotos quadradas 1000×1000px**, fundo neutro, iluminação bem trabalhada.",
        warning: "As fotos precisam estar hospedadas em URL pública. Não dá pra fazer upload direto de arquivo local. Se precisar hospedar, use o Media Library do Supabase Storage.",
      },
      {
        title: "Definir preço e estoque",
        body: "Digite:\n\n- **Preço**: valor em reais (ex: 49,90)\n- **Preço promocional** (opcional): se preenchido, aparece riscado ao lado do preço normal\n- **Em estoque**: marque a caixa se o produto estiver disponível pra compra. Se desmarcado, aparece 'Esgotado' na loja",
        tip: "Pra fazer promoção, preenche 'Preço promocional' e salva. Pra remover a promoção depois, apaga o valor e salva de novo.",
      },
      {
        title: "Preencher dados de envio (obrigatório)",
        body: "Na seção **Envio (Melhor Envio)**:\n\n- **Peso** em gramas (ex: 300)\n- **Comprimento** em cm\n- **Largura** em cm\n- **Altura** em cm\n\nEsses dados são usados pra calcular o frete automático no checkout.",
        warning: "**Sempre preencha** os dados de envio antes de publicar. Se algum campo ficar vazio, o cálculo de frete pode falhar e o cliente ver frete R$ 0 — o que é prejuízo pra você.",
      },
      {
        title: "Salvar e publicar",
        body: "Confira todos os campos e clique em **Salvar**. Se marcar a caixa **Ativo**, o produto aparece na loja pública imediatamente. Você pode salvar como rascunho (desmarcado) e ativar depois.",
      },
    ],
  },

  {
    id: "criar-promocao",
    title: "Como criar uma promoção em produto",
    description: "Aplicar desconto num produto específico da loja.",
    category: "produtos",
    estimatedMinutes: 2,
    steps: [
      {
        title: "Encontrar o produto",
        body: "No menu, vai em **Produtos** e clica no produto que quer colocar em promoção. Você pode buscar pelo nome ou filtrar pela categoria.",
      },
      {
        title: "Preencher preço promocional",
        body: "No campo **Preço promocional**, digita o valor novo (ex: 39,90 se o preço normal era 49,90).\n\nAssim que salvar, a loja vai mostrar o preço original riscado (R$ 49,90) ao lado do promocional (R$ 39,90) em destaque.",
      },
      {
        title: "Salvar",
        body: "Clica em **Salvar**. A promoção fica ativa imediatamente na loja.",
        tip: "Pra remover a promoção depois, apaga o valor do campo 'Preço promocional' e salva de novo. O produto volta ao preço normal.",
      },
    ],
  },

  {
    id: "gerenciar-estoque",
    title: "Como gerenciar o estoque de um produto",
    description: "Marcar como esgotado, controlar disponibilidade e evitar overselling.",
    category: "produtos",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Marcar produto como esgotado",
        body: "Vai em **Produtos** → abre o produto → desmarca a caixa **Em estoque** → **Salvar**.\n\nO produto passa a mostrar 'Esgotado' na loja e o botão de comprar fica desabilitado. Cliente ainda vê a página, mas não consegue adicionar ao carrinho.",
      },
      {
        title: "Reativar quando repuser",
        body: "Quando chegar mercadoria nova, volta em **Produtos** → abre o mesmo produto → marca **Em estoque** de novo → **Salvar**.\n\nO botão de comprar volta a aparecer imediatamente.",
      },
      {
        title: "Desativar produto (esconder da loja)",
        body: "Se quiser tirar o produto **da vitrine** temporariamente (mas manter cadastrado), desmarca **Ativo** → Salva.\n\nDiferença entre **Ativo** e **Em estoque**:\n\n- **Ativo desmarcado**: some completamente da loja pública, ninguém vê\n- **Em estoque desmarcado**: aparece na loja mas com 'Esgotado', gera curiosidade",
        tip: "Use 'Em estoque' quando é falta temporária que vai voltar. Use 'Ativo' quando é lançamento futuro ou produto descontinuado.",
      },
      {
        title: "Ativar em lote (múltiplos produtos)",
        body: "Ainda não temos ação em lote pra produtos. Se precisar ativar/desativar vários de uma vez, faz um por um. Se isso virar rotina, me avisa que priorizo essa feature.",
      },
    ],
  },

  // ============ PEDIDOS ============
  {
    id: "processar-pedido",
    title: "Como processar um pedido do início ao fim",
    description: "Do momento que o pedido cai no admin até a etiqueta impressa e o pacote despachado.",
    category: "pedidos",
    estimatedMinutes: 5,
    steps: [
      {
        title: "Ver pedidos pendentes",
        body: "No menu do admin, clica em **Pedidos**. Por padrão você vê os pedidos **pendentes** (que aguardam confirmação de pagamento).\n\nUsa os chips no topo pra filtrar: Todos / Pendentes / Confirmados / Enviados / Cancelados. A busca no topo procura por código do pedido, nome ou email do cliente.",
      },
      {
        title: "Aguardar confirmação de pagamento",
        body: "Quando o pagamento é aprovado, o sistema **automaticamente** muda o pedido de **Pendente** pra **Confirmado**. Não precisa fazer nada nessa etapa.\n\n- **PIX** aprova em segundos (assim que o cliente paga no app do banco)\n- **Cartão** aprova em 3-5s quando processa\n- **Boleto** pode levar até 2 dias úteis pra compensar",
        tip: "Você recebe email automático em cada aprovação. Também aparece toast azul no admin em tempo real se você estiver logada.",
      },
      {
        title: "Comprar etiqueta no Melhor Envio",
        body: "No card do pedido **Confirmado**, clica em **Comprar etiqueta ME**. Uma janela de confirmação aparece mostrando o valor a debitar do saldo Melhor Envio.\n\nSe você tem saldo suficiente, o sistema automaticamente:\n1. Compra a etiqueta com a transportadora escolhida pelo cliente\n2. Debita o valor do saldo ME\n3. Gera o PDF da etiqueta\n4. Preenche o código de rastreio\n5. Manda email pro cliente com o rastreio",
        warning: "Sempre confere seu saldo no dashboard antes. Se o saldo cair abaixo do limite configurado, aparece um alerta vermelho no admin.",
      },
      {
        title: "Imprimir e despachar",
        body: "Depois de comprar, o botão vira **Baixar etiqueta** (link pra um PDF). Clica pra baixar, imprime em papel A4 (ou etiqueta adesiva se tiver), corta e cola no pacote.\n\nLeva o pacote no Correios ou ponto de coleta da transportadora antes do prazo (geralmente 3 dias úteis)",
      },
      {
        title: "Status automático a partir daqui",
        body: "Quando você compra a etiqueta, o status do pedido já muda automaticamente pra **Enviado**. Não precisa marcar nada manual.\n\nQuando os Correios confirmam a entrega, o Melhor Envio nos avisa via webhook e o status muda pra **Concluído**. Cliente recebe email de confirmação de entrega automaticamente.",
      },
    ],
  },

  {
    id: "cancelar-pedido",
    title: "Como cancelar um pedido",
    description: "Cancelar por decisão sua ou porque cliente pediu.",
    category: "pedidos",
    estimatedMinutes: 2,
    steps: [
      {
        title: "Encontrar o pedido",
        body: "Vai em **Pedidos** e localiza pelo campo de busca (código do pedido, nome ou email da cliente).",
      },
      {
        title: "Cancelar no admin",
        body: "No card do pedido, clica em **Cancelar**. Uma modal de confirmação aparece.\n\nSe o pedido estava **Pendente** (sem pagamento) ou **Confirmado** (com pagamento mas sem etiqueta), o cancelamento é seguro.",
        warning: "Cancelamento não é reversível. Se já tiver comprado etiqueta ME, o saldo NÃO é devolvido automaticamente — você precisa cancelar no painel do Melhor Envio manualmente pra ter o valor de volta.",
      },
      {
        title: "Se o pedido já foi pago — reembolso",
        body: "Se o cliente já pagou, você precisa devolver o valor manualmente:\n\n1. Vai no painel do gateway de pagamento (Mercado Pago ou Asaas)\n2. Encontra a transação pelo código\n3. Clica em **Reembolsar**\n\nO valor cai no cartão do cliente em 1-5 dias úteis (ou volta pro PIX na hora).",
      },
    ],
  },

  {
    id: "bulk-actions-pedidos",
    title: "Como aprovar ou processar vários pedidos de uma vez",
    description: "Use ações em lote pra economizar tempo em dias movimentados.",
    category: "pedidos",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Selecionar múltiplos pedidos",
        body: "Em **Pedidos**, cada card tem uma checkbox no canto superior esquerdo. Marca a checkbox de todos os pedidos que quer processar juntos.\n\nUma barra flutuante verde aparece no topo da tela com o número de pedidos selecionados.",
      },
      {
        title: "Aprovar em lote",
        body: "Com pedidos selecionados, a barra mostra o botão **Aprovar N pedidos**. Clica → confirma na modal → todos passam de **Pendente** pra **Confirmado** de uma vez.\n\nEmails de confirmação são disparados pra cada cliente automaticamente.",
        tip: "Só usa isso se realmente tem certeza que todos os selecionados devem ser aprovados. Não dá pra desfazer.",
      },
      {
        title: "Comprar múltiplas etiquetas ao mesmo tempo",
        body: "Seleciona vários pedidos **Confirmados** com frete já escolhido → clica **Comprar N etiquetas**.\n\nO sistema processa em paralelo. Se alguma falhar (ex: saldo baixo), você vê quais falharam com o motivo. As outras são processadas normalmente.",
        warning: "Antes de fazer bulk buy, confere que tem saldo suficiente pra todas as etiquetas juntas. Se saldo insuficiente, algumas vão falhar no meio.",
      },
      {
        title: "Marcar como concluído em lote",
        body: "Pedidos entregues (que os Correios já registraram) ficam **Concluídos** automaticamente. Mas se algum ficou preso em **Enviado**, você pode marcar em lote:\n\nSeleciona → **Marcar como concluído** → confirma.",
      },
    ],
  },

  {
    id: "resolver-erro-etiqueta-me",
    title: "Como resolver erro na compra de etiqueta ME",
    description: "Quando o botão 'Comprar etiqueta ME' dá erro, o que verificar.",
    category: "pedidos",
    estimatedMinutes: 4,
    steps: [
      {
        title: "Ler a mensagem de erro",
        body: "Quando falha, aparece um aviso vermelho abaixo do botão com o motivo. Os erros mais comuns e como resolver:\n\n- **'failed_at_cart'**: dados do envio incompletos (peso, dimensões, endereço)\n- **'failed_at_checkout'**: saldo insuficiente na conta ME\n- **'failed_at_generate'**: transportadora rejeitou (raro)\n- **'token inválido'**: precisa reconfigurar credenciais em `/admin/configuracoes/melhor-envio`",
      },
      {
        title: "Se for erro de peso/dimensões",
        body: "Anota qual produto tá no pedido → vai em **Produtos** → abre o produto → confere a seção **Envio (Melhor Envio)**.\n\nOs 4 campos precisam estar preenchidos: peso (g), comprimento, largura, altura (cm). Se algum tá vazio ou zerado, preenche e salva.\n\nVolta em Pedidos → tenta comprar etiqueta de novo.",
      },
      {
        title: "Se for saldo insuficiente",
        body: "1. Loga em `melhorenvio.com.br`\n2. Vai em **Carteira** ou **Saldo**\n3. Adiciona saldo via PIX ou cartão (geralmente cai na hora)\n4. Volta no admin e tenta comprar a etiqueta de novo\n\nO limite de aviso pode ser configurado em `/admin/configuracoes/melhor-envio` → 'Alerta de saldo baixo (centavos)'.",
        tip: "Deixa sempre um mínimo de R$ 100 no saldo pra evitar surpresas. Um saldo baixo pode fazer você perder venda no dia movimentado.",
      },
      {
        title: "Se for endereço incompleto do cliente",
        body: "Expande o card do pedido → confere se **CEP, rua, número, cidade e estado** estão preenchidos.\n\nSe cliente esqueceu de algum campo, você pode:\n1. Ligar/WhatsApp e pedir o dado\n2. Atualizar direto pelo Supabase (Dashboard → Table Editor → orders → coluna customer_address)\n3. Recomeçar: cancela o pedido e pede pro cliente refazer",
      },
      {
        title: "Última opção: gerar etiqueta manual no ME",
        body: "Se nada funcionar, dá pra gerar a etiqueta direto no painel do Melhor Envio:\n\n1. Loga em `melhorenvio.com.br` → **Envios** → **+ Novo envio**\n2. Preenche remetente (você) + destinatário (dados do cliente)\n3. Escolhe a transportadora\n4. Baixa PDF\n\nDepois, cola o **código de rastreio** manual no admin (campo aparece expandindo o pedido) pra o cliente conseguir acompanhar.",
      },
    ],
  },

  // ============ CURSOS ============
  {
    id: "cadastrar-curso",
    title: "Como cadastrar um curso novo",
    description: "Criar curso, organizar em módulos, adicionar aulas do YouTube.",
    category: "cursos",
    estimatedMinutes: 10,
    steps: [
      {
        title: "Criar o curso",
        body: "Menu → **Cursos** → **+ Novo curso**. Preenche:\n\n- **Nome do curso**\n- **Descrição curta** (aparece nos cards)\n- **Descrição completa** (página do curso)\n- **Preço** (0 pra grátis, ou valor pra pago via Mercado Pago)\n- **Imagem de capa** (URL da foto)",
      },
      {
        title: "Organizar em módulos (opcional)",
        body: "Dentro do curso, você pode criar **módulos** pra agrupar aulas relacionadas (ex: 'Introdução ao Yoga', 'Postura e Respiração', 'Prática Avançada').\n\nCada módulo pode ter várias aulas dentro. Isso ajuda a aluna a navegar em cursos longos.",
        tip: "Se o curso tem só 3-4 aulas, você pode pular os módulos e colocar todas as aulas soltas. Módulos são úteis quando tem 5+ aulas.",
      },
      {
        title: "Adicionar aulas",
        body: "Dentro de cada módulo (ou solto), clica em **+ Nova aula** e preenche:\n\n- **Título da aula**\n- **YouTube ID**: parte depois de v= na URL do YouTube. Exemplo: em `youtube.com/watch?v=dQw4w9WgXcQ`, o ID é `dQw4w9WgXcQ`\n- **Duração** em minutos\n- **Descrição** (aparece abaixo do vídeo)\n- **Recursos** (opcional): links pra PDF, checklist, playlist Spotify...",
        warning: "O vídeo do YouTube precisa estar como **público** ou **não listado**. Vídeos privados ou removidos não carregam pra alunas e mostra erro.",
      },
      {
        title: "Definir ordem das aulas",
        body: "Na lista de aulas, você pode arrastar com o mouse pra reordenar. A ordem definida aqui é a sequência que a aluna vai seguir no player.",
      },
      {
        title: "Publicar o curso",
        body: "Marca o curso como **Publicado**. A partir daí ele aparece em `/cursos` pra qualquer visitante navegar e comprar (se for pago) ou matricular (se grátis).",
        tip: "Se o curso tá em construção, deixa **Rascunho**. Assim você pode montar tudo com calma e só publicar quando estiver pronto.",
      },
    ],
  },

  {
    id: "criar-modulos",
    title: "Como criar módulos num curso",
    description: "Organizar aulas em grupos temáticos pra navegação mais clara.",
    category: "cursos",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Abrir o curso",
        body: "Menu → **Cursos** → clica no curso que quer organizar → você vai pra tela de edição do curso.",
      },
      {
        title: "Criar primeiro módulo",
        body: "Na seção **Aulas**, se ainda não tem módulos, você vê as aulas soltas. Clica em **+ Novo módulo** e dá um nome (ex: 'Introdução ao Yoga').\n\nO módulo aparece como um bloco expansível acima das aulas.",
      },
      {
        title: "Adicionar aulas ao módulo",
        body: "Você pode:\n\n1. **Arrastar aulas existentes** pra dentro do módulo (segura e arrasta com o mouse)\n2. **Criar aulas novas** direto dentro do módulo clicando em **+ Nova aula** dentro do bloco expansível",
        tip: "Deixa a primeira aula como 'Aula 0 - Boas-vindas' curta pra apresentar você e o curso. Ajuda a aluna a se conectar antes de mergulhar no conteúdo.",
      },
      {
        title: "Reordenar módulos",
        body: "Se tem múltiplos módulos, arrasta pra cima ou pra baixo pra mudar a ordem que aparecem pra aluna.\n\nA aluna vê os módulos na ordem que você definiu — ela precisa completar as aulas de um módulo antes de partir pro próximo (em cursos com progressão obrigatória).",
      },
      {
        title: "Deletar módulo (cuidado)",
        body: "Se apagar um módulo, as aulas dele ficam soltas de novo (não são deletadas). Depois você pode reorganizar em outro módulo ou deletar as aulas individualmente.",
        warning: "Deletar aula é destrutivo — se aluna já matriculada tinha progresso naquela aula, se perde. Evita deletar aulas de cursos com muita gente matriculada.",
      },
    ],
  },

  {
    id: "responder-qa",
    title: "Como responder perguntas de alunas (Q&A)",
    description: "Interagir com alunas que fazem perguntas dentro do curso.",
    category: "cursos",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Ver perguntas pendentes",
        body: "Menu → **Cursos** → clica no curso → seção **Perguntas & Respostas** (Q&A).\n\nVocê vê todas as perguntas feitas pelas alunas, ordenadas por mais recente. Cada pergunta mostra: nome da aluna, aula relacionada, texto da pergunta e data.",
      },
      {
        title: "Responder",
        body: "Clica em **Responder** abaixo da pergunta. Um campo de texto aparece.\n\nEscreve a resposta e clica **Enviar**. A aluna recebe email automático com sua resposta e vê ela no próprio player do curso na próxima vez que abrir.",
        tip: "Respostas suas aparecem destacadas com o selo 'Elisa Hoeppers' — mostra pras outras alunas que você tá presente. Isso aumenta a percepção de valor e engajamento.",
      },
      {
        title: "Marcar como resolvida",
        body: "Depois de responder, marca a pergunta como **Resolvida**. Ela some da lista de pendentes.\n\nSe cliente fizer perguntas duplicadas ou irrelevantes, você pode **Ocultar** — só você e a aluna que perguntou continuam vendo.",
      },
      {
        title: "Perguntas de outras alunas",
        body: "Se uma pergunta é muito boa e útil pra todo mundo, deixa ela **Pública** (padrão). Outras alunas vão ver ela e sua resposta, o que ajuda o aprendizado coletivo.\n\nUse **Privada** só se a pergunta expõe algo pessoal da aluna que ela não gostaria de compartilhar.",
      },
    ],
  },

  // ============ CLIENTES ============
  {
    id: "convidar-admin",
    title: "Como convidar um novo administrador ou instrutor",
    description: "Dar acesso ao painel admin pra outra pessoa (assistente, instrutora, sócio).",
    category: "clientes",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Acessar gestão de usuários",
        body: "Menu → **Clientes** (ou **Configurações → Usuários**).\n\nVocê vê a lista completa de contas cadastradas com nome, email, tipo (aluna/instrutora/admin) e último login.",
      },
      {
        title: "Clicar em Convidar novo usuário",
        body: "No topo da página, clica em **+ Convidar usuário**. Uma modal aparece pedindo:\n\n- **Email** da pessoa\n- **Nome** (opcional, mas ajuda pra identificar)\n- **Tipo de acesso**:\n  - **Aluna**: acesso normal ao painel (cursos comprados)\n  - **Instrutora**: acesso ao admin (produtos, pedidos, cursos), mas SEM chaves de API/pagamento\n  - **Admin**: acesso total incluindo configurações sensíveis",
        warning: "Só dá **Admin** pra pessoas de confiança total. Admin vê chaves do Mercado Pago, Asaas, Melhor Envio — informações críticas do negócio.",
      },
      {
        title: "Enviar convite",
        body: "Clica **Enviar convite**. A pessoa recebe email do Supabase com link pra criar senha e ativar a conta.\n\nO email chega em ~1 minuto. Se demorar, avisa a pessoa pra olhar spam.",
        tip: "Depois que a pessoa criar senha, ela pode entrar em `/login` normalmente e vai automaticamente pra `/admin` (se for instrutora/admin) ou `/painel` (se for aluna).",
      },
      {
        title: "Trocar tipo de acesso depois",
        body: "Se depois quiser mudar o tipo (ex: promover instrutora pra admin), volta na lista → clica na linha do usuário → altera o campo **Tipo** → salva.\n\nA mudança é imediata. A pessoa precisa fazer logout/login pra o novo tipo pegar.",
      },
    ],
  },

  {
    id: "gerenciar-cliente",
    title: "Como gerenciar uma cliente (aluna)",
    description: "Buscar, resetar senha, ver histórico, excluir conta.",
    category: "clientes",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Buscar cliente específica",
        body: "Menu → **Clientes**. Usa o campo de busca no topo pra procurar por **nome** ou **email**.\n\nA lista filtra em tempo real conforme você digita.",
      },
      {
        title: "Ver detalhes da cliente",
        body: "Clica na linha da cliente. Você vê:\n\n- Dados básicos (nome, email, data de cadastro)\n- Histórico de pedidos (com valores)\n- Cursos matriculada\n- Último login\n- Endereços salvos",
        tip: "Uma cliente que gasta muito ou compra recorrente pode virar VIP. Você pode dar cupom personalizado, brinde no próximo pedido, etc.",
      },
      {
        title: "Resetar senha da cliente",
        body: "Se cliente pediu ajuda porque esqueceu a senha e não consegue recuperar sozinha:\n\n1. Encontra ela na lista\n2. Clica em **Resetar senha**\n3. Confirma na modal\n\nCliente recebe email com link pra criar uma senha nova.",
      },
      {
        title: "Excluir conta (LGPD)",
        body: "Se cliente pedir formalmente pra excluir os dados (direito LGPD), você deve:\n\n1. Clica em **Excluir conta**\n2. Confirma que entende o impacto\n3. Sistema apaga: profile, endereços, wishlist\n4. **Preserva**: pedidos passados (nota fiscal precisa manter por 5 anos, obrigação legal)",
        warning: "Excluir é irreversível. Se cliente pedir pra restaurar depois, não dá — precisa criar conta nova.",
      },
    ],
  },

  {
    id: "cadastrar-disponibilidade",
    title: "Como cadastrar horários disponíveis pra aulas",
    description: "Definir quando alunas podem reservar aulas particulares.",
    category: "clientes",
    estimatedMinutes: 4,
    steps: [
      {
        title: "Acessar Disponibilidade",
        body: "Menu → **Agendamentos** → aba **Disponibilidade** (ou botão **Gerenciar disponibilidade**).\n\nVocê vê um calendário semanal com blocos vazios (horários bloqueados) e blocos verdes (horários disponíveis).",
      },
      {
        title: "Criar horário recorrente",
        body: "Pra abrir um horário que se repete toda semana (ex: 'toda quarta 19h-20h'):\n\n1. Clica em **+ Nova regra**\n2. Escolhe o **dia da semana**\n3. Define **hora início** e **hora fim**\n4. Escolhe se é pra **aula particular** ou **aula em grupo**\n5. Salva\n\nEsse horário aparece verde no calendário e alunas podem reservar por `/agende-sua-aula`.",
        tip: "Deixa gaps de 15 min entre aulas pra preparar espaço e não atrasar a próxima.",
      },
      {
        title: "Bloquear datas específicas (férias, feriados)",
        body: "Pra bloquear um dia ou período específico (ex: 'férias de 20/12 a 05/01'):\n\n1. Clica em **+ Bloqueio**\n2. Escolhe **data início** e **data fim**\n3. Escreve motivo (opcional, só pra você lembrar)\n4. Salva\n\nHorários nesse período ficam bloqueados independente das regras recorrentes. Alunas não veem opção de reservar naqueles dias.",
      },
      {
        title: "Remover regra ou bloqueio",
        body: "Clica na regra ou bloqueio que quer apagar → clica **Excluir** → confirma.\n\nHorários voltam ao padrão. Se tinha reservas nos horários afetados, elas continuam (não são canceladas automaticamente).",
        warning: "Se apagar regra que já tem reservas confirmadas, as reservas permanecem. Você precisa cancelar cada uma individualmente se quiser abrir mão delas.",
      },
    ],
  },

  {
    id: "gerenciar-reservas",
    title: "Como confirmar ou cancelar reservas de aula",
    description: "Aprovar/recusar as reservas que alunas fazem pelo site.",
    category: "clientes",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Ver reservas pendentes",
        body: "Menu → **Agendamentos**. Você vê a lista de todas as reservas ordenadas por data.\n\nFiltros disponíveis:\n- **Pendentes**: aguardam sua confirmação\n- **Confirmadas**: aprovadas e vão acontecer\n- **Realizadas**: já aconteceram\n- **Canceladas**: recusadas ou canceladas depois\n\nVocê recebe email a cada nova reserva. Toast azul também aparece em tempo real se estiver logada.",
      },
      {
        title: "Confirmar reserva",
        body: "No card da reserva pendente, clica **Confirmar**. Cliente recebe email automático com:\n\n- Data e hora confirmadas\n- Local (se presencial) ou link do Zoom/Meet (se online)\n- Suas instruções (o que trazer, o que vestir, etc)\n\nO status muda pra **Confirmada** e o horário fica bloqueado no calendário de disponibilidade.",
        tip: "Confirma o mais rápido possível — cliente fica ansiosa esperando resposta. Ideal: <2h úteis.",
      },
      {
        title: "Cancelar ou recusar reserva",
        body: "Se não puder atender no horário pedido, clica **Cancelar**. Uma modal pede o motivo (opcional).\n\nCliente recebe email com o motivo. Se tinha pago, o valor é reembolsado (você faz manual pelo gateway).\n\nO horário volta a ficar disponível pra outras reservas.",
        warning: "Cancelar reservas frequentemente prejudica sua reputação. Só cancela em último caso ou quando é impossível remarcar.",
      },
      {
        title: "Remarcar (mudar horário)",
        body: "Se combinou com a cliente de mudar pra outro dia:\n\n1. Cancela a reserva atual\n2. Cria uma nova (ou pede pra cliente reservar de novo pelo site)\n\n*Reagendamento direto em 1 clique ainda não está implementado — no roadmap.*",
      },
    ],
  },

  // ============ MARKETING ============
  {
    id: "criar-broadcast",
    title: "Como enviar email pra base (Broadcast)",
    description: "Compor e disparar email pra segmentos: newsletter, alunas, compradoras.",
    category: "marketing",
    estimatedMinutes: 6,
    steps: [
      {
        title: "Acessar Broadcast",
        body: "Menu → **Broadcast**. Você verá o **compositor** de novo email e o **histórico** de todos os envios anteriores (com data, segmento e taxa de abertura, se disponível).",
      },
      {
        title: "Escolher o segmento",
        body: "Antes de escrever o email, decide pra quem vai:\n\n- **Todas as inscritas** — quem tá na newsletter (mais amplo)\n- **Compradoras de curso X** — filtra por curso específico\n- **Compradoras de produto Y** — filtra por produto físico\n- **Alunas com pedido nos últimos 30 dias** — engajamento recente\n\nCada segmento mostra o **número de destinatárias** antes de enviar.",
        tip: "Segmentar bem = taxa de abertura maior. Email genérico pra todo mundo tende a ser ignorado. Email de curso pra quem já comprou aquele curso tem 3-5x mais engajamento.",
      },
      {
        title: "Compor o email",
        body: "Preenche:\n\n- **Assunto**: entre 40-60 caracteres, evita CAIXA ALTA (parece spam)\n- **Corpo (HTML)**: você pode usar tags HTML básicas: `<p>`, `<b>` (negrito), `<i>` (itálico), `<a href=\"URL\">link</a>`, `<br>` (quebra de linha), `<ul>`, `<li>` (listas)\n- **Nome do remetente**: geralmente 'BODYOGA' ou 'Elisa Hoeppers'\n- **Email de resposta** (Reply-To): pra onde vão as respostas se cliente responder",
      },
      {
        title: "Testar antes de enviar",
        body: "**SEMPRE** clica em **Enviar teste** pro seu próprio email antes. Confere:\n\n1. Assunto aparece bem no Gmail e no celular?\n2. Layout tá correto (sem quebras estranhas)?\n3. Links funcionam?\n4. Ortografia OK?\n5. Imagem aparece (se tiver)?",
        warning: "Emails enviados NÃO podem ser deletados nem editados depois. Se mandar com erro, todos os destinatários vão receber e ver o erro. Sempre teste primeiro.",
      },
      {
        title: "Disparar pra todo mundo",
        body: "Depois do teste OK, clica em **Enviar pra [N] destinatárias**. O sistema envia em **lotes de 100 por minuto** pra evitar bloqueio dos serviços de email.\n\nUm broadcast grande (1000+ pessoas) pode levar 10-15 minutos pra completar. Você acompanha o progresso na barra que aparece.",
      },
      {
        title: "Acompanhar resultado",
        body: "Depois do envio, o histórico mostra o **status** de cada broadcast:\n\n- Enviado\n- Entregue\n- Aberto (se tiver tracking)\n- Clicou (se tiver tracking)\n\nUsa esses dados pra ajustar assunto e conteúdo dos próximos envios.",
      },
    ],
  },

  {
    id: "moderar-reviews",
    title: "Como moderar avaliações de produtos e cursos",
    description: "Aprovar, ocultar ou destacar reviews que clientes deixaram.",
    category: "marketing",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Acessar Avaliações",
        body: "Menu → **Avaliações**. Você vê todas as reviews que clientes deixaram, com filtros por:\n\n- **Pendentes de moderação** (novas, ainda não aprovadas)\n- **Aprovadas** (aparecem no site)\n- **Ocultadas** (moderadas por você)\n- **Todas**\n\nCada review mostra: cliente, estrelas (1-5), texto, data e produto/curso avaliado.",
      },
      {
        title: "Aprovar review",
        body: "Reviews positivas ou construtivas: clica em **Aprovar**. Ela aparece imediatamente na página do produto/curso e ajuda a converter novos clientes.\n\nSe a review tem foto anexada, ela também vai junto.",
        tip: "Reviews com estrelas 4-5 e texto detalhado são as mais impactantes. Estrela 5 sem texto ainda ajuda mas menos.",
      },
      {
        title: "Ocultar review problemática",
        body: "Se uma review contém:\n\n- Xingamento ou linguagem ofensiva\n- Informação falsa\n- Spam ou promoção de outra marca\n- Dados pessoais (telefone, endereço)\n\nClica em **Ocultar**. Ela some do site mas fica no admin (pra auditoria).",
        warning: "Não oculta reviews negativas construtivas só porque criticam. Reviews 3-4 estrelas com feedback honesto dão credibilidade. Ocultar só reviews claramente inadequadas.",
      },
      {
        title: "Responder review",
        body: "Você pode responder qualquer review (positiva ou negativa) clicando em **Responder**.\n\nEscreve sua resposta e envia. Cliente recebe email + a resposta aparece embaixo da review original no site.\n\nPra reviews negativas, responder com empatia e mostrar como vai resolver **converte crítica em oportunidade** de mostrar seu atendimento.",
      },
    ],
  },

  {
    id: "criar-post-blog",
    title: "Como criar um post no blog",
    description: "Publicar artigo, notícia ou dica no /blog do site.",
    category: "marketing",
    estimatedMinutes: 5,
    steps: [
      {
        title: "Acessar Posts",
        body: "Menu → **Posts**. Você vê a lista de todos os posts publicados e rascunhos.\n\nCada post mostra: título, data de publicação, status (publicado/rascunho) e visualizações (se tracking).",
      },
      {
        title: "Criar novo post",
        body: "Clica em **+ Novo post**. Preenche:\n\n- **Título**: chamativo, entre 40-70 caracteres\n- **Slug**: URL amigável (ex: 'beneficios-do-yoga-para-ansiedade')\n- **Resumo**: 1-2 parágrafos que aparecem na listagem\n- **Imagem de capa**: URL da foto principal\n- **Autor**: você (ou instrutora convidada)\n- **Categoria**: escolhe da lista existente ou cria nova",
      },
      {
        title: "Escrever o conteúdo",
        body: "O editor aceita **Markdown**:\n\n- `# Título grande`, `## Subtítulo`\n- `**negrito**`, `*itálico*`\n- `- item de lista`\n- `[texto do link](URL)`\n- `![alt da imagem](URL da imagem)`\n\nSe preferir escrever visual, pode colar texto direto do Google Docs ou Word — a formatação básica vem junto.",
        tip: "Posts com **imagens no meio do texto** têm 3x mais tempo de leitura que só texto. Adiciona 1 imagem a cada 300-400 palavras.",
      },
      {
        title: "SEO básico",
        body: "Nas configurações do post, preenche:\n\n- **Meta descrição**: 140-160 caracteres que aparecem no Google\n- **Palavras-chave** (opcional): pra você lembrar qual termo tá otimizando\n- **URL amigável**: geralmente igual ao slug\n\nIsso ajuda o post a aparecer no Google quando gente procura pelos temas.",
      },
      {
        title: "Publicar ou salvar rascunho",
        body: "Duas opções:\n\n- **Salvar rascunho**: fica no admin, ninguém vê ainda. Bom pra escrever aos poucos.\n- **Publicar**: aparece imediatamente em `/blog` do site.\n\nPra despublicar depois (mas manter o texto): volta no post → muda status pra **Rascunho** → salva.",
        warning: "Post publicado tem URL indexada pelo Google. Se você despublicar, o Google pode demorar semanas pra tirar da busca. Evita publicar/despublicar em curto prazo.",
      },
    ],
  },

  // ============ CONFIGURAÇÕES ============
  {
    id: "configurar-mp",
    title: "Como configurar Mercado Pago",
    description: "Ativar checkout online com cartão, PIX e boleto.",
    category: "config",
    estimatedMinutes: 5,
    steps: [
      {
        title: "Criar conta Mercado Pago",
        body: "Se ainda não tem, cria em `www.mercadopago.com.br/registro`. Recomendo **conta PJ** (CNPJ) pra taxas menores e emissão de nota.\n\nDepois de criar, precisa **verificar identidade** enviando documentos (CNH ou RG + CNPJ). Aprovação leva 1-3 dias úteis.",
      },
      {
        title: "Pegar as chaves de API",
        body: "1. Loga em `www.mercadopago.com.br/developers`\n2. Vai em **Suas integrações** → cria uma aplicação nova (nome: 'BODYOGA')\n3. Copia:\n   - **Public Key** (começa com `APP_USR-`)\n   - **Access Token** (começa com `APP_USR-`)\n\nExistem 2 pares de chaves: **Teste** (sandbox) e **Produção** (real). Use **teste** primeiro pra validar sem risco.",
        warning: "**NUNCA compartilha o Access Token de produção**. Ele é como senha da sua conta. Se vazar, alguém pode processar pagamentos em seu nome.",
      },
      {
        title: "Colar no admin",
        body: "Menu → **Configurações** → **Mercado Pago**. Cola:\n\n- **Public Key** no campo correspondente\n- **Access Token** no campo correspondente\n- **Ambiente**: 'sandbox' pra testes, 'production' pra vender de verdade\n\nSalva.",
      },
      {
        title: "Configurar webhook",
        body: "No painel do MP → **Desenvolvedores** → **Webhooks** → adiciona:\n\n**URL**: `https://<seu-projeto>.functions.supabase.co/mp-webhook`\n\n**Eventos**: marca **Pagamentos** e **Assinaturas**.\n\nSalva no MP.",
        tip: "Se você adicionou **chave secreta do webhook** (recomendado pra segurança), cola no admin no campo 'Chave secreta do webhook' e também no painel MP.",
      },
      {
        title: "Testar",
        body: "1. Vai em `/admin/diagnostico-pagamentos`\n2. Roda os 5 checks — todos verdes = tudo certo\n3. Faz um pedido de teste na loja usando o **cartão sandbox**: `5031 4332 1540 6351`, val `11/25`, CVV `123`, nome `APRO`\n4. Confirma que o pedido aparece como **Confirmado** no admin em segundos",
      },
    ],
  },

  {
    id: "monitorar-saldo-me",
    title: "Como monitorar o saldo do Melhor Envio",
    description: "Evitar surpresas na hora de comprar etiqueta por saldo baixo.",
    category: "config",
    estimatedMinutes: 2,
    steps: [
      {
        title: "Ver saldo no dashboard",
        body: "No dashboard principal (`/admin`), o saldo do Melhor Envio aparece num card no topo.\n\nSe o saldo estiver **abaixo do limite configurado** (padrão: R$ 100), um **banner vermelho** aparece avisando pra recarregar.",
      },
      {
        title: "Ajustar limite de alerta",
        body: "Menu → **Configurações** → **Melhor Envio** → campo **Alerta de saldo baixo (centavos)**.\n\nExemplo: se coloca `10000`, o alerta dispara quando saldo cair abaixo de R$ 100,00.\n\nRecomendo colocar pelo menos **3-5 vezes o valor médio de uma etiqueta** — assim tem tempo de repor sem quebrar a operação.",
        tip: "Se sua etiqueta média custa R$ 20, deixa alerta em R$ 100. Se custa R$ 50 (produtos maiores), deixa em R$ 300.",
      },
      {
        title: "Adicionar saldo",
        body: "1. Loga em `melhorenvio.com.br`\n2. Vai em **Carteira**\n3. Escolhe forma de recarga: PIX (cai na hora) ou cartão\n4. Digita valor (mínimo geralmente R$ 20)\n5. Confirma\n\nAssim que cair, o banner vermelho no admin some automaticamente.",
      },
      {
        title: "Recarga automática (opcional)",
        body: "No painel do Melhor Envio, dá pra ativar **recarga automática por cartão** — quando saldo cair abaixo de X, ele recarrega Y automaticamente.\n\nÚtil pra não parar operação, mas atenção com valor mensal máximo pra não estourar orçamento.",
      },
    ],
  },

  {
    id: "cliente-nao-recebeu-email",
    title: "Cliente diz que não recebeu email do pedido",
    description: "Diagnosticar e resolver reclamações de email não chegou.",
    category: "config",
    estimatedMinutes: 5,
    steps: [
      {
        title: "Confere primeiro se o email realmente saiu",
        body: "1. Vai no Supabase Dashboard → **Edge Functions** → `send-notification` → aba **Logs**\n2. Procura pelo email da cliente ou timestamp aproximado\n3. Vê se aparece:\n   - **200 OK**: email saiu do Resend com sucesso\n   - **401/403**: erro de API key ou domínio não verificado\n   - **422**: dados inválidos (email malformado, from não autorizado)\n\nSe **saiu com 200**, o problema é do lado do cliente (spam, filtro, etc). Se **erro**, você precisa corrigir a config.",
      },
      {
        title: "Verificar no Resend Dashboard",
        body: "Loga em `resend.com/emails` e busca o email pela data ou pro endereço.\n\nStatus possíveis:\n\n- **Delivered**: chegou. Cliente precisa procurar em spam/promoções.\n- **Bounced**: endereço não existe. Confere se cliente digitou email certo.\n- **Deferred**: servidor do cliente atrasou. Aguarda ou reenvia.\n- **Complained**: cliente marcou como spam. Não envia mais pra esse email.",
      },
      {
        title: "Se chegou mas cliente não achou",
        body: "Peça pra cliente:\n\n1. Procurar em **Spam / Lixo eletrônico**\n2. Procurar em **Promoções** (Gmail)\n3. Buscar por 'BODYOGA' ou 'pedido' na busca do email\n4. Verificar se o email tá correto no cadastro (talvez digitou errado)\n\nSe achou no spam, pede pra **marcar como Não é spam** — ajuda pra próximos emails chegarem na caixa principal.",
        tip: "Manda print do email dela cadastro dela pra confirmar antes de enviar de novo. Um caractere errado (I virou l, O virou 0) resolve o caso.",
      },
      {
        title: "Reenviar manualmente",
        body: "Se cliente confirma que não chegou nem no spam:\n\n1. Vai em **Pedidos** → encontra o pedido\n2. Clica em **Reenviar email** (se disponível)\n3. Ou expande detalhes → copia link do pedido → manda direto por WhatsApp\n\nNo pior caso, tira print do pedido no admin e envia pelo WhatsApp.",
      },
      {
        title: "Diagnóstico geral do Resend",
        body: "Se **vários clientes** estão reportando que não recebem, é config quebrada. Vai em:\n\n`/admin/diagnostico-rebrand` (se existir) → roda checks\n\nProblemas comuns:\n- **RESEND_API_KEY expirada**: gera nova no Resend e cola no Supabase Secrets\n- **Domínio não verificado**: verifica DNS no Resend\n- **DNS mudou**: reconfigura registros SPF/DKIM/DMARC",
      },
    ],
  },
];

export const categories = {
  produtos: { label: "Produtos", icon: "📦" },
  cursos: { label: "Cursos", icon: "🎓" },
  pedidos: { label: "Pedidos", icon: "🛒" },
  clientes: { label: "Clientes", icon: "👤" },
  marketing: { label: "Marketing", icon: "📢" },
  config: { label: "Configurações", icon: "⚙️" },
} as const;
