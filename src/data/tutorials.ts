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
        warning: "As fotos precisam estar hospedadas em URL pública (Cloudflare R2, Supabase Storage, etc). Não dá pra fazer upload direto de arquivo local. Se precisar hospedar, use o Media Library do Supabase Storage.",
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
        body: "Depois de comprar, o botão vira **Baixar etiqueta** (link pra um PDF). Clica pra baixar, imprime em papel A4 (ou etiqueta adesiva se tiver), corta e cola no pacote.\n\nLeva o pacote no Correios ou ponto de coleta da transportadora antes do prazo (geralmente 3 dias úteis).",
      },
      {
        title: "Status automático a partir daqui",
        body: "Quando você compra a etiqueta, o status do pedido já muda automaticamente pra **Enviado**. Não precisa marcar nada manual.\n\nQuando os Correios confirmam a entrega, o Melhor Envio nos avisa via webhook e o status muda pra **Concluído**. Cliente recebe email de confirmação de entrega automaticamente.",
      },
      {
        title: "Se der problema com a etiqueta",
        body: "Se o botão 'Comprar etiqueta ME' falhar com erro vermelho:\n\n1. Confere se o produto tem **peso e dimensões** cadastrados (/admin/produtos)\n2. Confere o **saldo ME** (banner vermelho aparece se baixo)\n3. Confere se o **endereço do cliente** tá completo (expande detalhes do pedido)\n\nO status mostra em qual etapa falhou (ex: 'failed_at_generate'). Você pode tentar de novo depois de corrigir.",
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
        tip: "Reembolso direto pelo admin do sistema está no roadmap. Por enquanto, sempre via painel do gateway.",
      },
    ],
  },

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
        body: "Dentro de cada módulo (ou solto), clica em **+ Nova aula** e preenche:\n\n- **Título da aula**\n- **YouTube ID**: parte depois de v= na URL do YouTube. Exemplo: em youtube.com/watch?v=dQw4w9WgXcQ, o ID é dQw4w9WgXcQ\n- **Duração** em minutos\n- **Descrição** (aparece abaixo do vídeo)\n- **Recursos** (opcional): links pra PDF, checklist, playlist Spotify",
        warning: "O vídeo do YouTube precisa estar como **público** ou **não listado**. Vídeos privados ou removidos não carregam pra alunas e mostra erro.",
      },
      {
        title: "Definir ordem das aulas",
        body: "Na lista de aulas, você pode arrastar com o mouse pra reordenar. A ordem definida aqui é a sequência que a aluna vai seguir no player.",
      },
      {
        title: "Publicar o curso",
        body: "Marca o curso como **Publicado**. A partir daí ele aparece em /cursos pra qualquer visitante navegar e comprar (se for pago) ou matricular (se grátis).",
        tip: "Se o curso tá em construção, deixa **Rascunho**. Assim você pode montar tudo com calma e só publicar quando estiver pronto.",
      },
    ],
  },

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
        body: "Preenche:\n\n- **Assunto**: entre 40-60 caracteres, evita CAIXA ALTA (parece spam)\n- **Corpo (HTML)**: você pode usar tags HTML básicas de formatação (parágrafo, negrito, itálico, link, quebra de linha, listas)\n- **Nome do remetente**: geralmente 'BODYOGA' ou 'Elisa Hoeppers'\n- **Email de resposta** (Reply-To): pra onde vão as respostas se cliente responder",
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
];

export const categories = {
  produtos: { label: "Produtos", icon: "📦" },
  cursos: { label: "Cursos", icon: "🎓" },
  pedidos: { label: "Pedidos", icon: "🛒" },
  clientes: { label: "Clientes", icon: "👤" },
  marketing: { label: "Marketing", icon: "📢" },
  config: { label: "Configurações", icon: "⚙️" },
} as const;
