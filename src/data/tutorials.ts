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
        body: "No menu lateral do admin, clique em **Produtos**. Você verá a lista de todos os produtos ativos.",
        image: "/images/tutoriais/produtos-lista.png",
      },
      {
        title: "Criar novo produto",
        body: "Clique no botão **+ Novo produto** no canto superior direito. Você será redirecionada pra tela de edição vazia.",
      },
      {
        title: "Preencher informações básicas",
        body: "Preencha:\n- **Nome**: título que aparece na loja (ex: 'Spray Antisséptico BODYOGA')\n- **Slug**: URL amigável, use minúsculas e hífens (ex: 'spray-antisseptico')\n- **Descrição curta**: 1-2 linhas que aparecem em cards\n- **Descrição completa**: texto longo que aparece na página do produto",
        tip: "Slug é a parte da URL depois de /loja/. Escolha algo curto e descritivo — não pode ser mudado depois sem quebrar links compartilhados.",
      },
      {
        title: "Adicionar fotos",
        body: "Na seção **Galeria**, clique em **+ Adicionar imagem** e cole a URL da foto (Cloudflare R2, Supabase Storage ou outro). A primeira foto vira a capa.",
        warning: "As fotos devem estar hospedadas em URL pública. Não dá pra fazer upload direto de arquivo local ainda.",
      },
      {
        title: "Preço e estoque",
        body: "Digite:\n- **Preço** em reais (ex: 49,90)\n- **Preço promocional** (opcional) — mostra riscado ao lado do preço\n- Marque **Em estoque** se disponível",
      },
      {
        title: "Dados de envio (obrigatório pro Melhor Envio)",
        body: "Na seção **Envio**:\n- **Peso** em gramas (ex: 300)\n- **Dimensões** em cm: comprimento × largura × altura",
        warning: "Se esses campos ficarem vazios, o cálculo de frete falha e o pedido pode ser criado com frete R$ 0. **Sempre preencha**.",
      },
      {
        title: "Publicar",
        body: "Confira todos os campos e clique em **Salvar**. Se marcar **Ativo**, o produto aparece na loja pública imediatamente.",
      },
    ],
  },
  {
    id: "processar-pedido",
    title: "Como processar um pedido",
    description: "Do momento que chega até a etiqueta impressa e despachada.",
    category: "pedidos",
    estimatedMinutes: 4,
    steps: [
      {
        title: "Ver pedidos pendentes",
        body: "No menu do admin, clique em **Pedidos**. Por padrão você vê os pendentes. Pode filtrar por status usando os chips no topo.",
        image: "/images/tutoriais/pedidos-lista.png",
      },
      {
        title: "Aprovar pagamento",
        body: "Quando o pagamento é confirmado (Mercado Pago envia webhook automático), o pedido muda de **Pendente** pra **Confirmado**. Você verá o badge muda de cor.",
        tip: "Pedidos PIX geralmente são aprovados em segundos. Boleto pode levar até 2 dias úteis. Cartão é instantâneo.",
      },
      {
        title: "Comprar etiqueta no Melhor Envio",
        body: "No card do pedido confirmado, clique em **Comprar etiqueta ME**. O sistema:\n1. Consulta seu saldo\n2. Compra a etiqueta com a transportadora que o cliente escolheu\n3. Gera o PDF automaticamente\n4. Preenche o código de rastreio",
        warning: "Verifique se tem saldo antes. Se saldo baixo, aparece banner vermelho no dashboard.",
      },
      {
        title: "Imprimir e despachar",
        body: "Depois de comprar, o botão vira **Baixar etiqueta** (link pro PDF). Baixa, imprime, cola no pacote e leva no Correios ou ponto de coleta.",
      },
      {
        title: "Marcar como enviado (automático)",
        body: "Quando você compra a etiqueta, o status já muda pra **Enviado** automaticamente. O cliente recebe email com código de rastreio.",
      },
      {
        title: "Concluir (automático)",
        body: "Quando os Correios registram entrega, o Melhor Envio nos avisa via webhook e o status vira **Concluído** sem você mexer.",
      },
    ],
  },
  {
    id: "cancelar-pedido",
    title: "Como cancelar um pedido",
    description: "Cancelar por decisão sua ou por falha de pagamento.",
    category: "pedidos",
    estimatedMinutes: 2,
    steps: [
      {
        title: "Encontrar o pedido",
        body: "Vá em **Pedidos** e localize o pedido pela busca (código, nome ou email).",
      },
      {
        title: "Cancelar",
        body: "No card do pedido, clique em **Cancelar**. Confirme na modal que aparece.",
        warning: "Cancelamento não é reversível. Se já comprou etiqueta ME, o saldo NÃO é devolvido automaticamente — você precisa cancelar no painel ME manualmente.",
      },
      {
        title: "Reembolsar (se pago)",
        body: "Se o cliente já pagou:\n1. Vá no painel do Mercado Pago\n2. Encontre a transação pelo código\n3. Clique em **Reembolsar**\n\n*Estamos avaliando integrar reembolso direto no admin.*",
      },
    ],
  },
  {
    id: "cadastrar-curso",
    title: "Como cadastrar um curso novo",
    description: "Criar curso, módulos, aulas e conectar a vídeos do YouTube.",
    category: "cursos",
    estimatedMinutes: 8,
    steps: [
      {
        title: "Criar o curso",
        body: "Menu → **Cursos** → **+ Novo curso**. Preencha nome, descrição, preço (0 pra grátis) e capa.",
      },
      {
        title: "Organizar em módulos",
        body: "Dentro do curso, crie **módulos** (ex: 'Introdução', 'Prática Básica'). Cada módulo agrupa várias aulas.",
        tip: "Módulos ajudam a organizar cursos longos. Se seu curso tem só 3-4 aulas, você pode pular essa etapa e colocar tudo num módulo único.",
      },
      {
        title: "Adicionar aulas",
        body: "Dentro de cada módulo, clique em **+ Nova aula**. Preencha:\n- **Título**\n- **YouTube ID** (a parte depois de v= na URL do YouTube, ex: 'dQw4w9WgXcQ')\n- **Duração** em minutos\n- **Descrição**",
        warning: "O vídeo do YouTube precisa estar como **público** ou **não listado**. Vídeos privados não carregam pra alunas.",
      },
      {
        title: "Ordem das aulas",
        body: "Na lista de aulas, arraste com o mouse pra reordenar. A ordem é a que aluna vai seguir.",
      },
      {
        title: "Publicar curso",
        body: "Marque o curso como **Publicado**. Ele aparece imediatamente em /cursos pra qualquer visitante.",
      },
    ],
  },
  {
    id: "criar-broadcast",
    title: "Como enviar email pra newsletter (Broadcast)",
    description: "Compor e disparar email pra todas as inscritas ou segmento.",
    category: "marketing",
    estimatedMinutes: 5,
    steps: [
      {
        title: "Acessar Broadcast",
        body: "Menu → **Broadcast**. Você vê o compositor e histórico de envios anteriores.",
      },
      {
        title: "Escolher segmento",
        body: "Opções:\n- **Todas as inscritas** — quem tá na newsletter\n- **Compradoras de curso X** — apenas quem comprou um curso específico\n- **Compradoras de produto Y** — apenas quem comprou produto físico\n\nEscolha o que faz sentido pra mensagem.",
      },
      {
        title: "Compor o email",
        body: "Preencha:\n- **Assunto** (aparece na caixa de entrada)\n- **Corpo HTML** — pode usar tags <b>, <br>, <a>, <p>, <ul>, <li>\n- **Nome do remetente** — geralmente 'BODYOGA'",
        tip: "Emails com assunto entre 40-60 caracteres têm melhor taxa de abertura. Evite CAIXA ALTA que parece spam.",
      },
      {
        title: "Testar antes",
        body: "Sempre clique em **Enviar teste** pro seu email primeiro. Confira como fica no Gmail, no celular, e cheque links.",
        warning: "Emails enviados NÃO podem ser deletados nem editados. Sempre teste antes.",
      },
      {
        title: "Disparar",
        body: "Depois de conferir tudo, clique em **Enviar pra [N] destinatárias**. O sistema envia em lotes de 100/min pra evitar bloqueio.",
      },
    ],
  },
  {
    id: "configurar-promocao",
    title: "Como criar uma promoção",
    description: "Aplicar desconto em produtos individuais.",
    category: "config",
    estimatedMinutes: 3,
    steps: [
      {
        title: "Escolher o produto",
        body: "Vá em **Produtos** e clique no produto que quer colocar em promoção.",
      },
      {
        title: "Preencher preço promocional",
        body: "No campo **Preço promocional**, digite o novo valor (ex: 39,90). O preço original (ex: 49,90) fica riscado ao lado.",
        image: "/images/tutoriais/preco-promo.png",
      },
      {
        title: "Salvar",
        body: "Clique em **Salvar**. A promoção fica visível na loja imediatamente com o preço riscado.",
        tip: "Pra tirar a promoção depois, apaga o valor de preço promocional e salva de novo.",
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
