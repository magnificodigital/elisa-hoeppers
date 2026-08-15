import { uid, type PageBlock } from "./page-blocks";

export type BlockType =
  | "hero"
  | "text"
  | "products"
  | "categories"
  | "image-text"
  | "gallery"
  | "image"
  | "video"
  | "cta"
  | "faq"
  | "testimonials"
  | "stats"
  | "benefits"
  | "timeline"
  | "author"
  | "courses"
  | "instagram"
  | "newsletter"
  | "custom-projects"
  | "yoga-classes"
  | "columns"
  | "shortcut-banner"
  | "spacer"
  | "home-hero"
  | "home-opening"
  | "home-rituals"
  | "home-intro"
  | "home-blog"
  | "booking-form"
  | "custom-project-form"
  | "signup-form";

export interface BlockDef {
  type: BlockType;
  label: string;
  desc: string;
  defaults: Record<string, any>;
  fields: BlockField[];
}

export type BlockField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "color" | "link" | "list" | "select" | "number" | "boolean" | "video";
  options?: { label: string; value: any }[];
  itemFields?: BlockField[]; // For lists
};

export const BLOCKS: Record<BlockType, BlockDef> = {
  hero: {
    type: "hero",
    label: "Hero",
    desc: "Banner principal",
    defaults: {
      title: "Título do Hero",
      subtitle: "Subtítulo ou frase de apoio",
      badge: "",
      buttonLabel: "Ver produtos",
      buttonHref: "#produtos",
      bgImage: "",
      bgVideo: "",
      overlay: 0.4,
      align: "center",
    },
    fields: [
      { key: "title", label: "Título", type: "textarea" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      { key: "badge", label: "Etiqueta superior", type: "text" },
      { key: "bgImage", label: "Imagem de fundo", type: "image" },
      { key: "bgVideo", label: "Vídeo de fundo", type: "video" },
      { key: "buttonLabel", label: "Texto do botão", type: "text" },
      { key: "buttonHref", label: "Link do botão", type: "link" },
      { key: "overlay", label: "Escurecimento (0-1)", type: "number" },
      { key: "align", label: "Alinhamento", type: "select", options: [{label: "Centro", value: "center"}, {label: "Esquerda", value: "left"}] },
    ]
  },
  text: {
    type: "text",
    label: "Texto",
    desc: "Título + parágrafo",
    defaults: { title: "Novo título", content: "Escreva seu texto aqui...", align: "left" },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "content", label: "Conteúdo", type: "textarea" },
      { key: "align", label: "Alinhamento", type: "select", options: [{label: "Esquerda", value: "left"}, {label: "Centro", value: "center"}] },
    ]
  },
  products: {
    type: "products",
    label: "Produtos em destaque",
    desc: "Grid de produtos da loja",
    defaults: { title: "Nossos Produtos", selection: "all", columns: 3 },
    fields: [
      { key: "title", label: "Título da seção", type: "text" },
      { key: "selection", label: "Seleção", type: "select", options: [{label: "Todos", value: "all"}, {label: "Destaques", value: "featured"}] },
      { key: "columns", label: "Colunas", type: "number" },
    ]
  },
  categories: {
    type: "categories",
    label: "Categorias",
    desc: "Grid de categorias",
    defaults: { items: [], columns: 3 },
    fields: [
      { key: "columns", label: "Colunas", type: "number" },
      { 
        key: "items", 
        label: "Itens", 
        type: "list",
        itemFields: [
          { key: "name", label: "Nome", type: "text" },
          { key: "image", label: "Imagem", type: "image" },
          { key: "link", label: "Link", type: "link" },
        ]
      }
    ]
  },
  "image-text": {
    type: "image-text",
    label: "Imagem + Texto",
    desc: "Duas colunas",
    defaults: { title: "Título", content: "", image: "", buttonLabel: "", buttonHref: "", side: "right" },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "content", label: "Conteúdo", type: "textarea" },
      { key: "image", label: "Imagem", type: "image" },
      { key: "buttonLabel", label: "Texto do botão", type: "text" },
      { key: "buttonHref", label: "Link do botão", type: "link" },
      { key: "side", label: "Lado da imagem", type: "select", options: [{label: "Direita", value: "right"}, {label: "Esquerda", value: "left"}] },
    ]
  },
  gallery: {
    type: "gallery",
    label: "Galeria",
    desc: "Grid de imagens",
    defaults: { images: [], columns: 3 },
    fields: [
      { key: "columns", label: "Colunas", type: "number" },
      { key: "images", label: "Imagens", type: "list", itemFields: [{ key: "url", label: "Imagem", type: "image" }] }
    ]
  },
  image: {
    type: "image",
    label: "Imagem",
    desc: "Foto avulsa com legenda",
    defaults: { url: "", caption: "", width: "100%" },
    fields: [
      { key: "url", label: "Imagem", type: "image" },
      { key: "caption", label: "Legenda", type: "text" },
      { key: "width", label: "Largura", type: "text" },
    ]
  },
  video: {
    type: "video",
    label: "Vídeo",
    desc: "YouTube/Vimeo/MP4",
    defaults: { url: "", ratio: "16/9", autoplay: false },
    fields: [
      { key: "url", label: "URL do Vídeo", type: "text" },
      { key: "ratio", label: "Proporção", type: "text" },
      { key: "autoplay", label: "Autoplay", type: "boolean" },
    ]
  },
  cta: {
    type: "cta",
    label: "CTA",
    desc: "Chamada para ação",
    defaults: { title: "Pronta para começar?", text: "", buttonLabel: "Ver loja", buttonHref: "/loja", bgColor: "primary" },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "text", label: "Texto", type: "textarea" },
      { key: "buttonLabel", label: "Texto do botão", type: "text" },
      { key: "buttonHref", label: "Link do botão", type: "link" },
      { key: "bgColor", label: "Cor de fundo", type: "select", options: [{label: "Marca", value: "primary"}, {label: "Creme", value: "cream"}] },
    ]
  },
  faq: {
    type: "faq",
    label: "FAQ",
    desc: "Perguntas e respostas",
    defaults: { title: "Dúvidas frequentes", items: [] },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "items", label: "Perguntas", type: "list", itemFields: [{key: "q", label: "Pergunta", type: "text"}, {key: "a", label: "Resposta", type: "textarea"}] }
    ]
  },
  testimonials: {
    type: "testimonials",
    label: "Depoimentos",
    desc: "Carrossel de avaliações",
    defaults: { items: [] },
    fields: [
      { key: "items", label: "Depoimentos", type: "list", itemFields: [{key: "name", label: "Nome", type: "text"}, {key: "text", label: "Texto", type: "textarea"}, {key: "photo", label: "Foto", type: "image"}] }
    ]
  },
  stats: {
    type: "stats",
    label: "Estatísticas",
    desc: "Números em destaque",
    defaults: { items: [] },
    fields: [
      { key: "items", label: "Números", type: "list", itemFields: [{key: "value", label: "Valor", type: "text"}, {key: "label", label: "Rótulo", type: "text"}] }
    ]
  },
  benefits: {
    type: "benefits",
    label: "Benefícios",
    desc: "Ícones + título + texto",
    defaults: { items: [] },
    fields: [
      { key: "items", label: "Itens", type: "list", itemFields: [{key: "title", label: "Título", type: "text"}, {key: "text", label: "Descrição", type: "textarea"}, {key: "icon", label: "Ícone", type: "select", options: [{label: "Folha", value: "leaf"}, {label: "Coração", value: "heart"}]}] }
    ]
  },
  timeline: {
    type: "timeline",
    label: "Linha do tempo",
    desc: "História da marca por ano",
    defaults: { items: [] },
    fields: [
      { key: "items", label: "Anos", type: "list", itemFields: [{key: "year", label: "Ano", type: "text"}, {key: "title", label: "Título", type: "text"}, {key: "text", label: "Descrição", type: "textarea"}] }
    ]
  },
  author: {
    type: "author",
    label: "Autoria",
    desc: "Bloco sobre a Elisa",
    defaults: { title: "Por Elisa Hoeppers", bio: "", photo: "", signature: "" },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "photo", label: "Foto", type: "image" },
      { key: "signature", label: "Assinatura", type: "image" },
    ]
  },
  courses: {
    type: "courses",
    label: "Cursos em destaque",
    desc: "Cards de cursos",
    defaults: { selection: "all", columns: 2 },
    fields: [
      { key: "selection", label: "Seleção", type: "select", options: [{label: "Todos", value: "all"}] },
      { key: "columns", label: "Colunas", type: "number" },
    ]
  },
  instagram: {
    type: "instagram",
    label: "Instagram",
    desc: "Feed do Instagram",
    defaults: { title: "Nos acompanhe no Instagram" },
    fields: [{ key: "title", label: "Título", type: "text" }]
  },
  newsletter: {
    type: "newsletter",
    label: "Newsletter",
    desc: "Captura de email",
    defaults: { title: "Cadastre-se para ganhar 10% OFF", text: "Receba nossas novidades e rituais." },
    fields: [{ key: "title", label: "Título", type: "text" }, { key: "text", label: "Texto", type: "textarea" }]
  },
  "custom-projects": {
    type: "custom-projects",
    label: "Projetos personalizados",
    desc: "CTA pro formulário",
    defaults: { title: "Sua marca tem um cheiro.", text: "Vamos criá-lo juntos." },
    fields: [{ key: "title", label: "Título", type: "text" }, { key: "text", label: "Texto", type: "textarea" }]
  },
  "yoga-classes": {
    type: "yoga-classes",
    label: "Aulas de Yoga",
    desc: "CTA pro agendamento",
    defaults: { title: "Pratique conosco", text: "Agende sua aula experimental." },
    fields: [{ key: "title", label: "Título", type: "text" }, { key: "text", label: "Texto", type: "textarea" }]
  },
  columns: {
    type: "columns",
    label: "Colunas livres",
    desc: "2 a 4 colunas",
    defaults: { count: 2, items: [] },
    fields: [
      { key: "count", label: "Nº Colunas", type: "number" },
      { key: "items", label: "Conteúdo", type: "list", itemFields: [{key: "content", label: "Texto/HTML", type: "textarea"}] }
    ]
  },
  "shortcut-banner": {
    type: "shortcut-banner",
    label: "Banner com atalhos",
    desc: "Título + botões + imagem",
    defaults: { title: "", image: "", shortcuts: [] },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "image", label: "Imagem", type: "image" },
      { key: "shortcuts", label: "Atalhos", type: "list", itemFields: [{key: "label", label: "Texto", type: "text"}, {key: "link", label: "Link", type: "link"}] }
    ]
  },
  spacer: {
    type: "spacer",
    label: "Espaçador",
    desc: "Espaço em branco",
    defaults: { height: 48 },
    fields: [{ key: "height", label: "Altura (px)", type: "number" }]
  },
  "home-hero": {
    type: "home-hero",
    label: "Hero (Slider)",
    desc: "Banner principal com os slides",
    defaults: {},
    fields: []
  },
  "home-opening": {
    type: "home-opening",
    label: "Frase de abertura",
    desc: "Ícone + frase curta",
    defaults: {
      icon: "https://hoepppers.lovable.app/assets/bodyoga/icone-bodyoga-2.png",
      title: "Equilíbrio para o corpo,\nmente e ambiente."
    },
    fields: [
      { key: "icon", label: "Ícone", type: "image" },
      { key: "title", label: "Frase", type: "textarea" }
    ]
  },
  "home-rituals": {
    type: "home-rituals",
    label: "Rituais (Produtos)",
    desc: "Grade com todos os produtos",
    defaults: {},
    fields: []
  },
  "home-intro": {
    type: "home-intro",
    label: "Apresentação (Elisa)",
    desc: "Imagem + texto",
    defaults: {
      title: "BODYOGA é a\nfusão entre *yoga* e\ncuidado consciente.",
      p1: "Cada produto é um ritual pensado pra trazer presença ao gesto cotidiano de cuidar de si.",
      p2: "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente.",
      ctaLabel: "Harmonia & Equilíbrio",
      ctaHref: "/sobre",
      image: "https://hoepppers.lovable.app/images/home/bodyoga/bodyoga-left.png"
    },
    fields: [
      { key: "image", label: "Imagem", type: "image" },
      { key: "title", label: "Título", type: "textarea" },
      { key: "p1", label: "Parágrafo 1", type: "textarea" },
      { key: "p2", label: "Parágrafo 2", type: "textarea" },
      { key: "ctaLabel", label: "Texto do botão", type: "text" },
      { key: "ctaHref", label: "Link do botão", type: "link" }
    ]
  },
  "home-blog": {
    type: "home-blog",
    label: "Blog na Home",
    desc: "Últimos posts",
    defaults: {},
    fields: []
  },
  "booking-form": {
    type: "booking-form",
    label: "Formulário de Agendamento",
    desc: "Widget completo de agendamento de aulas",
    defaults: {},
    fields: []
  },
  "custom-project-form": {
    type: "custom-project-form",
    label: "Formulário de Projetos Personalizados",
    desc: "Widget de solicitação de projetos sob medida",
    defaults: {},
    fields: []
  },
  "signup-form": {
    type: "signup-form",
    label: "Formulário de Cadastro",
    desc: "Widget de cadastro de novos alunos",
    defaults: {},
    fields: []
  },
};

export function createBlockInstance(type: BlockType) {
  const def = BLOCKS[type];
  return {
    id: uid(),
    type: type,
    props: { ...def.defaults },
  };
}
