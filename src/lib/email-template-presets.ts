import { supabase } from "./supabase";

const LOGO =
  "https://bodyogaoficial.com.br/__l5e/assets-v1/20aa83d7-e4d0-45c3-a8c7-02d231e4c53b/logo-bodyoga.png";
const GREEN = "#2F4A3A";
const CREAM = "#F5EFE6";
const FOOTER =
  'BODYOGA · Corpo, mente e ambiente em equilíbrio<br/><a href="https://bodyogaoficial.com.br" style="color:#2F4A3A">bodyogaoficial.com.br</a>';

let seq = 0;
const uid = (p: string) => `${p}_${++seq}`;

const base = (htmlID: string, cls: string) => ({
  _meta: { htmlID, htmlClassNames: cls },
  selectable: true,
  draggable: true,
  duplicatable: true,
  deletable: true,
  hideable: true,
  hideDesktop: false,
  displayCondition: null,
});

const logoBlock = () => ({
  id: uid("c"),
  type: "image",
  values: {
    containerPadding: "20px",
    anchor: "",
    src: { url: LOGO, width: 300, height: 120, autoWidth: false, maxWidth: "140px" },
    textAlign: "center",
    altText: "BODYOGA",
    action: { name: "web", values: { href: "", target: "_blank" } },
    ...base(uid("u_content_image"), "u_content_image"),
  },
});

const headingBlock = (text: string) => ({
  id: uid("c"),
  type: "heading",
  values: {
    containerPadding: "10px 20px",
    anchor: "",
    headingType: "h1",
    fontFamily: { label: "Georgia", value: "georgia,serif" },
    fontWeight: 400,
    fontSize: "26px",
    textAlign: "center",
    lineHeight: "130%",
    linkStyle: { inherit: true },
    color: GREEN,
    text,
    _override: {},
    ...base(uid("u_content_heading"), "u_content_heading"),
  },
});

const textBlock = (html: string, fontSize = "15px", color = "#1a1a1a") => ({
  id: uid("c"),
  type: "text",
  values: {
    containerPadding: "10px 24px",
    anchor: "",
    fontFamily: { label: "Arial", value: "arial,helvetica,sans-serif" },
    fontWeight: 400,
    fontSize,
    textAlign: "center",
    lineHeight: "160%",
    linkStyle: { inherit: true },
    color,
    text: `<p style="line-height: 160%;">${html}</p>`,
    ...base(uid("u_content_text"), "u_content_text"),
  },
});

const buttonBlock = (label: string, href: string) => ({
  id: uid("c"),
  type: "button",
  values: {
    containerPadding: "20px",
    anchor: "",
    href: { name: "web", values: { href, target: "_blank" } },
    buttonColors: {
      color: "#FFFFFF",
      backgroundColor: GREEN,
      hoverColor: "#FFFFFF",
      hoverBackgroundColor: "#243a2e",
    },
    size: { autoWidth: true, width: "100%" },
    fontWeight: 500,
    fontSize: "13px",
    textAlign: "center",
    lineHeight: "120%",
    padding: "14px 36px",
    border: {},
    borderRadius: "999px",
    letterSpacing: "2px",
    text: `<span style="text-transform: uppercase;">${label}</span>`,
    calculatedWidth: 200,
    calculatedHeight: 44,
    ...base(uid("u_content_button"), "u_content_button"),
  },
});

const dividerBlock = () => ({
  id: uid("c"),
  type: "divider",
  values: {
    width: "80%",
    border: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "#d6cdb9" },
    textAlign: "center",
    containerPadding: "18px",
    ...base(uid("u_content_divider"), "u_content_divider"),
  },
});

const row = (contents: any[], backgroundColor = "") => ({
  id: uid("r"),
  cells: [1],
  columns: [
    {
      id: uid("col"),
      contents,
      values: {
        _meta: { htmlID: uid("u_column"), htmlClassNames: "u_column" },
        border: {},
        padding: "0px",
        borderRadius: "0px",
        backgroundColor: "",
      },
    },
  ],
  values: {
    columns: false,
    backgroundColor,
    columnsBackgroundColor: "",
    backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
    padding: "0px",
    anchor: "",
    ...base(uid("u_row"), "u_row"),
  },
});

const wrapDesign = (rows: any[]) => ({
  counters: {
    u_row: 40,
    u_column: 40,
    u_content_image: 20,
    u_content_heading: 20,
    u_content_text: 20,
    u_content_button: 20,
    u_content_divider: 20,
  },
  body: {
    id: "u_body",
    rows,
    headers: [],
    footers: [],
    values: {
      popupPosition: "center",
      popupWidth: "600px",
      popupHeight: "auto",
      borderRadius: "10px",
      contentAlign: "center",
      contentVerticalAlign: "center",
      contentWidth: "600px",
      fontFamily: { label: "Arial", value: "arial,helvetica,sans-serif" },
      textColor: "#1a1a1a",
      popupBackgroundColor: "#FFFFFF",
      popupBackgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "cover", position: "center" },
      popupOverlay_backgroundColor: "rgba(0, 0, 0, 0.1)",
      popupCloseButton_position: "top-right",
      popupCloseButton_backgroundColor: "#DDDDDD",
      popupCloseButton_iconColor: "#000000",
      popupCloseButton_borderRadius: "0px",
      popupCloseButton_margin: "0px",
      popupCloseButton_action: {
        name: "close_popup",
        attrs: { onClick: "document.querySelector('.u-popup-container').style.display = 'none';" },
      },
      backgroundColor: CREAM,
      backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
      preheaderText: "",
      linkStyle: { body: true, linkColor: GREEN, linkHoverColor: GREEN, linkUnderline: true, linkHoverUnderline: true },
      _meta: { htmlID: "u_body", htmlClassNames: "u_body" },
    },
  },
  schemaVersion: 12,
});

type Preset = {
  system_key: string;
  name: string;
  subject: string;
  title: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
};

export const EMAIL_PRESETS: Preset[] = [
  {
    system_key: "welcome_coupon",
    name: "Cupom de boas-vindas",
    subject: "Seu cupom de {{discount}}% chegou 🌿",
    title: "Seu cupom chegou 🌿",
    paragraphs: [
      "Bem-vinda ao universo Bodyoga. Como agradecimento, preparamos um cupom especial para você.",
      "Use o código abaixo no checkout:",
      '<strong style="font-size:22px;letter-spacing:3px;color:#2F4A3A">{{coupon_code}}</strong><br/><span style="color:#666">Válido por 7 dias · {{discount}}% de desconto</span>',
    ],
    cta: { label: "Comprar agora", href: "https://bodyogaoficial.com.br/loja" },
  },
  {
    system_key: "order_confirmed",
    name: "Pedido confirmado",
    subject: "Pedido #{{order_code}} confirmado",
    title: "Pedido confirmado",
    paragraphs: [
      "Olá {{customer_name}}, recebemos seu pedido <strong>#{{order_code}}</strong>.",
      "Total: <strong>{{order_total}}</strong>",
      "Assim que ele for despachado avisamos você por e-mail com o código de rastreio.",
    ],
    cta: { label: "Ver meu pedido", href: "https://bodyogaoficial.com.br/pedido/{{order_code}}" },
  },
  {
    system_key: "order_shipped",
    name: "Pedido enviado",
    subject: "Seu pedido #{{order_code}} está a caminho",
    title: "Seu pedido está a caminho",
    paragraphs: [
      "Olá {{customer_name}}, o pedido <strong>#{{order_code}}</strong> foi enviado.",
      'Código de rastreio: <strong style="letter-spacing:2px;color:#2F4A3A">{{tracking_code}}</strong>',
    ],
    cta: { label: "Rastrear pedido", href: "https://bodyogaoficial.com.br/pedido/{{order_code}}" },
  },
  {
    system_key: "appointment_confirmed",
    name: "Agendamento confirmado",
    subject: "Sua sessão está confirmada",
    title: "Agendamento confirmado",
    paragraphs: [
      "Olá {{customer_name}}, sua sessão está confirmada.",
      "<strong>{{service_title}}</strong><br/>{{appointment_date}} às {{appointment_time}}",
      "Código: <strong>{{appointment_code}}</strong>",
    ],
    cta: { label: "Ver detalhes", href: "https://bodyogaoficial.com.br/agende-sua-aula" },
  },
  {
    system_key: "newsletter_welcome",
    name: "Boas-vindas newsletter",
    subject: "Bem-vinda à Bodyoga",
    title: "Bem-vinda à Bodyoga",
    paragraphs: [
      "Que bom ter você por aqui. A partir de agora você recebe novidades, lançamentos e conteúdos exclusivos.",
      "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas.",
    ],
    cta: { label: "Conhecer a loja", href: "https://bodyogaoficial.com.br/loja" },
  },
  {
    system_key: "blank",
    name: "Campanha em branco",
    subject: "Novidades da Bodyoga",
    title: "Título da campanha",
    paragraphs: [
      "Escreva aqui o texto principal da sua campanha.",
      "Você pode arrastar novos blocos, imagens e botões pelo editor.",
    ],
    cta: { label: "Saiba mais", href: "https://bodyogaoficial.com.br" },
  },
];

export function buildPresetDesign(p: Preset) {
  const rows: any[] = [row([logoBlock()], "#FFFFFF"), row([headingBlock(p.title)])];
  p.paragraphs.forEach((t) => rows.push(row([textBlock(t)])));
  if (p.cta) rows.push(row([buttonBlock(p.cta.label, p.cta.href)]));
  rows.push(row([dividerBlock(), textBlock(FOOTER, "12px", "#666666")]));
  return wrapDesign(rows);
}

export function buildPresetHtml(p: Preset) {
  const paras = p.paragraphs
    .map(
      (t) =>
        `<tr><td style="padding:10px 24px;font:15px/1.6 Arial,sans-serif;color:#1a1a1a;text-align:center">${t}</td></tr>`
    )
    .join("");
  const cta = p.cta
    ? `<tr><td align="center" style="padding:20px"><a href="${p.cta.href}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;padding:14px 36px;border-radius:999px;font:500 13px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase">${p.cta.label}</a></td></tr>`
    : "";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:${CREAM}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CREAM}">
<tr><td align="center" style="background:#fff;padding:20px"><img src="${LOGO}" alt="BODYOGA" width="140" style="display:block;max-width:140px;height:auto"/></td></tr>
<tr><td align="center" style="padding:20px 24px 10px;font:400 26px/1.3 Georgia,serif;color:${GREEN}">${p.title}</td></tr>
${paras}${cta}
<tr><td align="center" style="padding:18px"><hr style="border:none;border-top:1px solid #d6cdb9;width:80%;margin:0"/></td></tr>
<tr><td align="center" style="padding:10px 24px 28px;font:12px/1.6 Arial,sans-serif;color:#666">${FOOTER}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Recria (ou cria) todos os templates de sistema com layout em blocos editáveis. */
export async function restoreDefaultTemplates(): Promise<number> {
  let count = 0;
  for (const p of EMAIL_PRESETS) {
    seq = 0;
    const payload = {
      name: p.name,
      subject: p.subject,
      design_json: buildPresetDesign(p),
      html: buildPresetHtml(p),
      is_system: true,
      system_key: p.system_key,
    };
    const { data: existing } = await (supabase as any)
      .from("email_templates")
      .select("id")
      .eq("system_key", p.system_key)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await (supabase as any)
        .from("email_templates")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from("email_templates").insert(payload);
      if (error) throw error;
    }
    count++;
  }
  return count;
}
