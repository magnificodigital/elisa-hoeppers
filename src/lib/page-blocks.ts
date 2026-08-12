export type BlockBg = "transparent" | "cream" | "white" | "sand" | "primary";
export type BlockPad = "none" | "sm" | "md" | "lg";
export type Align = "left" | "center" | "right";

export type BlockStyle = {
  bg?: BlockBg;
  pad?: BlockPad;
  width?: "narrow" | "normal" | "wide" | "full";
};

export type PageBlock = {
  id: string;
  type: BlockType;
  style?: BlockStyle;
  props: Record<string, any>;
};

export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "gallery"
  | "video"
  | "button"
  | "buttons"
  | "spacer"
  | "divider"
  | "quote"
  | "columns"
  | "features"
  | "cards"
  | "faq"
  | "list"
  | "stats"
  | "testimonial"
  | "hero"
  | "cta"
  | "html";

export type BlockDef = {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  group: "Texto" | "Mídia" | "Layout" | "Seções";
  defaults: () => Omit<PageBlock, "id">;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const BLOCK_LIBRARY: BlockDef[] = [
  {
    type: "heading",
    label: "Título",
    description: "Um título de seção",
    icon: "Heading",
    group: "Texto",
    defaults: () => ({ type: "heading", style: { pad: "sm" }, props: { text: "Novo título", level: 2, align: "left" } }),
  },
  {
    type: "text",
    label: "Texto",
    description: "Parágrafo com formatação simples",
    icon: "Type",
    group: "Texto",
    defaults: () => ({
      type: "text",
      style: { pad: "sm" },
      props: { content: "Escreva aqui o seu texto. Use **negrito**, *itálico* e [links](https://).", align: "left" },
    }),
  },
  {
    type: "list",
    label: "Lista",
    description: "Lista com marcadores",
    icon: "List",
    group: "Texto",
    defaults: () => ({ type: "list", style: { pad: "sm" }, props: { items: ["Primeiro item", "Segundo item"], ordered: false } }),
  },
  {
    type: "quote",
    label: "Citação",
    description: "Destaque uma frase",
    icon: "Quote",
    group: "Texto",
    defaults: () => ({ type: "quote", style: { pad: "md" }, props: { text: "Uma frase que inspira.", author: "" } }),
  },
  {
    type: "image",
    label: "Imagem",
    description: "Imagem com legenda",
    icon: "Image",
    group: "Mídia",
    defaults: () => ({ type: "image", style: { pad: "sm" }, props: { url: "", alt: "", caption: "", rounded: true } }),
  },
  {
    type: "gallery",
    label: "Galeria",
    description: "Várias imagens em grade",
    icon: "Images",
    group: "Mídia",
    defaults: () => ({ type: "gallery", style: { pad: "md" }, props: { images: [], columns: 3 } }),
  },
  {
    type: "video",
    label: "Vídeo",
    description: "YouTube ou arquivo de vídeo",
    icon: "Video",
    group: "Mídia",
    defaults: () => ({ type: "video", style: { pad: "md" }, props: { url: "", caption: "" } }),
  },
  {
    type: "button",
    label: "Botão",
    description: "Um botão de ação",
    icon: "MousePointerClick",
    group: "Layout",
    defaults: () => ({ type: "button", style: { pad: "sm" }, props: { label: "Saiba mais", href: "/", align: "center", variant: "solid" } }),
  },
  {
    type: "buttons",
    label: "Grupo de botões",
    description: "Dois ou mais botões lado a lado",
    icon: "Rows3",
    group: "Layout",
    defaults: () => ({
      type: "buttons",
      style: { pad: "sm" },
      props: {
        align: "center",
        items: [
          { label: "Comprar", href: "/loja", variant: "solid" },
          { label: "Saiba mais", href: "/sobre", variant: "outline" },
        ],
      },
    }),
  },
  {
    type: "spacer",
    label: "Espaço",
    description: "Espaço em branco",
    icon: "MoveVertical",
    group: "Layout",
    defaults: () => ({ type: "spacer", props: { size: 48 } }),
  },
  {
    type: "divider",
    label: "Divisória",
    description: "Linha separadora",
    icon: "Minus",
    group: "Layout",
    defaults: () => ({ type: "divider", style: { pad: "sm" }, props: {} }),
  },
  {
    type: "columns",
    label: "Duas colunas",
    description: "Texto e imagem lado a lado",
    icon: "Columns2",
    group: "Layout",
    defaults: () => ({
      type: "columns",
      style: { pad: "md" },
      props: {
        title: "Título da seção",
        content: "Texto da coluna de conteúdo.",
        image: "",
        imageSide: "right",
        buttonLabel: "",
        buttonHref: "",
      },
    }),
  },
  {
    type: "features",
    label: "Destaques",
    description: "Grade de benefícios com título e texto",
    icon: "Sparkles",
    group: "Seções",
    defaults: () => ({
      type: "features",
      style: { pad: "lg", bg: "white" },
      props: {
        title: "",
        columns: 3,
        items: [
          { title: "Artesanal", text: "Feito à mão, em pequenos lotes." },
          { title: "Natural", text: "Ingredientes puros e conscientes." },
          { title: "Fresquinho", text: "Produzido sob demanda." },
        ],
      },
    }),
  },
  {
    type: "cards",
    label: "Cartões",
    description: "Cartões com imagem, título e link",
    icon: "LayoutGrid",
    group: "Seções",
    defaults: () => ({
      type: "cards",
      style: { pad: "lg" },
      props: {
        title: "",
        columns: 3,
        items: [
          { image: "", title: "Cartão 1", text: "Descrição curta", href: "" },
          { image: "", title: "Cartão 2", text: "Descrição curta", href: "" },
        ],
      },
    }),
  },
  {
    type: "faq",
    label: "Perguntas frequentes",
    description: "Lista de perguntas e respostas",
    icon: "HelpCircle",
    group: "Seções",
    defaults: () => ({
      type: "faq",
      style: { pad: "lg" },
      props: {
        title: "Perguntas frequentes",
        items: [{ q: "Qual o prazo de entrega?", a: "Enviamos em até 3 dias úteis." }],
      },
    }),
  },
  {
    type: "stats",
    label: "Números",
    description: "Indicadores em destaque",
    icon: "BarChart3",
    group: "Seções",
    defaults: () => ({
      type: "stats",
      style: { pad: "lg", bg: "white" },
      props: {
        items: [
          { value: "+500", label: "clientes" },
          { value: "100%", label: "natural" },
          { value: "10", label: "anos de prática" },
        ],
      },
    }),
  },
  {
    type: "testimonial",
    label: "Depoimento",
    description: "Depoimento com foto e nome",
    icon: "MessageSquareQuote",
    group: "Seções",
    defaults: () => ({
      type: "testimonial",
      style: { pad: "lg", bg: "sand" },
      props: { text: "Mudou a minha rotina por completo.", author: "Nome da cliente", role: "", avatar: "" },
    }),
  },
  {
    type: "hero",
    label: "Capa (hero)",
    description: "Imagem grande com título e botão",
    icon: "PanelTop",
    group: "Seções",
    defaults: () => ({
      type: "hero",
      props: {
        image: "",
        title: "Título da capa",
        subtitle: "Uma frase de apoio",
        buttonLabel: "",
        buttonHref: "",
        height: "medium",
        align: "center",
      },
    }),
  },
  {
    type: "cta",
    label: "Chamada (CTA)",
    description: "Faixa de destaque com botão",
    icon: "Megaphone",
    group: "Seções",
    defaults: () => ({
      type: "cta",
      style: { pad: "lg", bg: "primary" },
      props: { title: "Pronta para começar?", text: "Conheça nossos produtos.", buttonLabel: "Ver loja", buttonHref: "/loja" },
    }),
  },
  {
    type: "html",
    label: "HTML / Embed",
    description: "Código incorporado (mapa, formulário…)",
    icon: "Code",
    group: "Layout",
    defaults: () => ({ type: "html", style: { pad: "md" }, props: { code: "" } }),
  },
];

export function getBlockDef(type: BlockType) {
  return BLOCK_LIBRARY.find((b) => b.type === type);
}

export function createBlock(type: BlockType): PageBlock {
  const def = getBlockDef(type)!;
  return { id: uid(), ...def.defaults() };
}

/** Converte markdown legado em blocos, para páginas antigas. */
export function markdownToBlocks(md: string): PageBlock[] {
  const chunks = (md ?? "").split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    if (/^#{2,3}\s/.test(chunk)) {
      const level = chunk.startsWith("### ") ? 3 : 2;
      return { id: uid(), type: "heading" as const, style: { pad: "sm" as const }, props: { text: chunk.replace(/^#+\s/, ""), level, align: "left" } };
    }
    if (chunk === "---") return { id: uid(), type: "divider" as const, style: { pad: "sm" as const }, props: {} };
    if (/^>\s/.test(chunk)) {
      return { id: uid(), type: "quote" as const, style: { pad: "md" as const }, props: { text: chunk.replace(/^>\s?/gm, ""), author: "" } };
    }
    if (/^!\[/.test(chunk)) {
      const m = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(chunk);
      if (m) return { id: uid(), type: "image" as const, style: { pad: "sm" as const }, props: { url: m[2], alt: m[1], caption: "", rounded: true } };
    }
    if (/^[-*]\s/.test(chunk)) {
      return {
        id: uid(),
        type: "list" as const,
        style: { pad: "sm" as const },
        props: { items: chunk.split("\n").map((l) => l.replace(/^[-*]\s?/, "")), ordered: false },
      };
    }
    return { id: uid(), type: "text" as const, style: { pad: "sm" as const }, props: { content: chunk, align: "left" } };
  });
}
