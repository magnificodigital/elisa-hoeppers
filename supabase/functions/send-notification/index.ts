// @ts-ignore - Deno runtime
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const ELISA_EMAIL = Deno.env.get("ELISA_EMAIL") ?? "elisa.hoeppers@gmail.com";
// @ts-ignore
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://bodyogaoficial.com.br";

const FROM = "BODYOGA <contato@bodyogaoficial.com.br>";
const REPLY_TO = ELISA_EMAIL;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Branding editável dos emails (Admin → Configurações → Emails)
const emailBranding = {
  logo_url: "",
  brand_color: "#3E573F",
  signature: "",
  footer_note: "bodyogaoficial.com.br",
};

async function loadEmailBranding() {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .eq("category", "emails");
    for (const row of data ?? []) {
      if (row.key === "email_logo_url") emailBranding.logo_url = row.value ?? "";
      else if (row.key === "email_brand_color" && row.value) emailBranding.brand_color = row.value;
      else if (row.key === "email_signature") emailBranding.signature = row.value ?? "";
      else if (row.key === "email_footer_note") emailBranding.footer_note = row.value ?? "";
    }
  } catch (e) {
    console.error("loadEmailBranding failed:", e);
  }
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTimeBR(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing, skipping email to", to);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error", res.status, err);
    throw new Error(`Resend ${res.status}: ${err}`);
  }
}

// Verifica se a cliente (com conta) desativou "Avisos de pedido".
// Pedidos de convidado (sem user_id) sempre recebem — são transacionais.
async function wantsOrderUpdates(userId: string | null): Promise<boolean> {
  if (!userId) return true;
  const { data } = await supabase
    .from("profiles")
    .select("notify_order_updates")
    .eq("id", userId)
    .maybeSingle();
  return data?.notify_order_updates !== false;
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #F5EBE2; color: #334C31; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 0 auto; padding: 24px; }
  .card { background: white; border-radius: 12px; padding: 32px; margin-top: 16px; }
  h1 { font-family: Georgia, serif; color: #3E573F; font-size: 28px; margin: 0 0 8px; }
  h2 { font-family: Georgia, serif; color: #3E573F; font-size: 20px; margin: 24px 0 12px; }
  p { line-height: 1.6; margin: 8px 0; }
  .label { color: #7A7A7A; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
  .code { font-family: Menlo, monospace; background: #F5EBE2; padding: 4px 10px; border-radius: 4px; font-size: 14px; }
  .btn { display: inline-block; background: #3E573F; color: white; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; font-size: 12px; margin-top: 16px; }
  .item { padding: 12px 0; border-bottom: 1px solid #DBCCBF; }
  .item:last-child { border-bottom: none; }
  .total-row { display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #DBCCBF; margin-top: 12px; font-weight: 600; }
  .muted { color: #7A7A7A; font-size: 13px; }
`;

function wrap(body: string): string {
  const header = emailBranding.logo_url
    ? `<div style="text-align:center;padding:8px 0 4px;"><img src="${emailBranding.logo_url}" alt="BODYOGA" style="max-height:56px;max-width:200px;height:auto;" /></div>`
    : `<div style="text-align:center;padding:8px 0 12px;"><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:6px;color:${emailBranding.brand_color || "#3E573F"};">BODYOGA</span></div>`;
  const signature = emailBranding.signature
    ? `<p class="muted" style="text-align:center;margin-top:20px;color:${emailBranding.brand_color};">${emailBranding.signature}</p>`
    : "";
  const footer = emailBranding.footer_note || "bodyogaoficial.com.br";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head><body><div class="container">${header}${body}${signature}<p class="muted" style="text-align:center;margin-top:24px;">${footer}</p></div></body></html>`;
}

async function handleBooking(recordId: string) {
  const { data: appt, error } = await supabase
    .from("appointments")
    .select(`*, service:services(title, duration_min, price_cents, is_online, is_group)`)
    .eq("id", recordId)
    .maybeSingle();
  if (error || !appt) throw new Error("appointment not found");

  const dateStr = formatDateTimeBR(appt.starts_at);
  const modality = `${appt.service.is_online ? "Online" : "Presencial"} · ${appt.service.is_group ? "Grupo" : "Particular"}`;
  const firstName = appt.customer_name.split(" ")[0];

  const customerHtml = wrap(`
    <div class="card">
      <h1>Reserva recebida!</h1>
      <p>Olá ${firstName}, sua reserva foi registrada. A Elisa entra em contato em até 24h pelo WhatsApp pra confirmar e combinar o pagamento.</p>
      <h2>Detalhes da aula</h2>
      <p><span class="label">Aula</span><br/>${appt.service.title}<br/><span class="muted">${modality}</span></p>
      <p><span class="label">Data e hora</span><br/>${dateStr}</p>
      <p><span class="label">Duração</span> ${appt.service.duration_min} min</p>
      <p><span class="label">Valor</span> ${formatBRL(appt.service.price_cents)}</p>
      <p><span class="label">Código</span> <span class="code">#${appt.code}</span></p>
      <a class="btn" href="https://wa.me/5511999999999">Falar no WhatsApp</a>
    </div>
  `);

  const elisaHtml = wrap(`
    <div class="card">
      <h1>Nova reserva: #${appt.code}</h1>
      <p><span class="label">Aluna</span><br/>${appt.customer_name}<br/>${appt.customer_email}${appt.customer_phone ? `<br/>${appt.customer_phone}` : ""}</p>
      <p><span class="label">Aula</span><br/>${appt.service.title} · ${modality}</p>
      <p><span class="label">Data</span> ${dateStr}</p>
      <p><span class="label">Valor</span> ${formatBRL(appt.service.price_cents)}</p>
      ${appt.notes ? `<p><span class="label">Mensagem da aluna</span><br/>"${appt.notes}"</p>` : ""}
      <a class="btn" href="${SITE_URL}/admin/agendamentos">Abrir admin</a>
    </div>
  `);

  await Promise.all([
    sendEmail(appt.customer_email, `Sua reserva #${appt.code} foi recebida 🧘`, customerHtml).catch((e) => console.error("customer email failed:", e)),
    sendEmail(ELISA_EMAIL, `Nova reserva: ${appt.customer_name} · ${appt.service.title}`, elisaHtml).catch((e) => console.error("elisa email failed:", e)),
  ]);
}


// ===== Jornada do pedido: barra de progresso usada em todos os e-mails =====
const ORDER_STEPS = ["Pedido recebido", "Pagamento aprovado", "Nota fiscal", "Enviado", "Em trânsito", "Entregue"];
function progressBar(current: number): string {
  const cells = ORDER_STEPS.map((label, i) => {
    const done = i <= current;
    const color = done ? "#3E573F" : "#D9CFC2";
    const text = done ? "#3E573F" : "#9A8F80";
    return `<td style="padding:0 2px;text-align:center;vertical-align:top;width:${Math.floor(100 / ORDER_STEPS.length)}%;">
      <div style="height:6px;border-radius:3px;background:${color};margin-bottom:6px;"></div>
      <div style="font-size:10px;line-height:1.3;color:${text};font-weight:${i === current ? 700 : 400};">${label}</div>
    </td>`;
  }).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr>${cells}</tr></table>`;
}
function trackingUrl(code: string): string {
  return `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(code)}`;
}
function orderLink(order: any): string {
  return order.user_id ? `${SITE_URL}/painel/pedidos` : `${SITE_URL}/pedido/${order.code}`;
}
async function loadOrder(orderId: string) {
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error || !order) throw new Error("order not found");
  return order;
}

async function handleOrder(recordId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", recordId)
    .maybeSingle();
  if (error || !order) throw new Error("order not found");

  const itemsHtml = (order.items as any[])
    .map(
      (it) =>
        `<div class="item"><p style="margin:0;font-weight:600;">${it.qty}× ${it.name}</p><p class="muted" style="margin:4px 0 0;">${formatBRL(it.unit_price_cents)} cada · ${formatBRL(it.total_cents)}</p></div>`
    )
    .join("");

  const addr = order.customer_address as any;
  const addressHtml = addr
    ? `<p><span class="label">Endereço</span><br/>${[addr.street, addr.number, addr.complement, addr.district, addr.city ? `${addr.city}/${addr.state ?? ""}` : null, addr.cep].filter(Boolean).join(", ")}</p>`
    : `<p class="muted">Frete a combinar por WhatsApp.</p>`;

  const firstName = order.customer_name.split(" ")[0];

  const hasAccount = !!order.user_id;
  const accountCta = hasAccount
    ? `<a class="btn" href="${SITE_URL}/painel/pedidos">Ver meus pedidos</a>`
    : `<a class="btn" href="${SITE_URL}/pedido/${order.code}">Ver pedido</a>
       <p class="muted" style="margin-top:16px;">Quer acompanhar futuras compras num lugar só?
       <a href="${SITE_URL}/cadastro-de-alunos">Crie sua conta aqui</a> (leva 30 segundos).</p>`;

  const shippingLine =
    order.shipping_cents > 0
      ? `<div class="total-row" style="font-weight:400;"><span>Frete${order.shipping_service_label ? ` · ${order.shipping_service_label}` : ""}</span><span>${formatBRL(order.shipping_cents)}</span></div>`
      : `<p class="muted">Frete a combinar por WhatsApp</p>`;

  const payLink =
    order.payment_method === "pagarme" && String(order.payment_preference_id ?? "").startsWith("pl_")
      ? `https://payment-link-v3.pagar.me/${order.payment_preference_id}`
      : null;

  const customerHtml = wrap(`
    <div class="card">
      <h1>Recebemos seu pedido 🌿</h1>
      ${progressBar(0)}
      <p>Olá ${firstName}, seu pedido <span class="code">#${order.code}</span> foi registrado e está <strong>aguardando a confirmação do pagamento</strong>. Assim que o pagamento for aprovado, você recebe outro e-mail e a gente já começa a preparar tudo.</p>
      <h2>Seu pedido</h2>
      ${itemsHtml}
      <div class="total-row" style="font-weight:400;"><span>Subtotal</span><span>${formatBRL(order.subtotal_cents)}</span></div>
      ${order.discount_cents > 0 ? `<div class="total-row" style="font-weight:400;"><span>Desconto${order.coupon_code ? ` · ${order.coupon_code}` : ""}</span><span>− ${formatBRL(order.discount_cents)}</span></div>` : ""}
      ${shippingLine}
      <div class="total-row"><span>Total</span><span>${formatBRL(order.total_cents)}</span></div>
      ${payLink ? `<a class="btn" href="${payLink}">Finalizar pagamento</a>
      <p class="muted">Se você já pagou, pode ignorar este botão — a confirmação chega em instantes.</p>` : ""}
      ${accountCta}
    </div>
  `);

  // Pedido já pago (ex.: confirmado manualmente antes do e-mail sair) não precisa do "aguardando".
  if (order.status !== "pending") return;
  if (!(await wantsOrderUpdates(order.user_id))) return;
  await sendEmail(order.customer_email, `Recebemos seu pedido #${order.code} 🌿`, customerHtml)
    .catch((e) => console.error("customer email failed:", e));
  void addressHtml; // usado no e-mail da Elisa (enviado no pagamento)
}

async function handleOrderPaid(orderId: string) {
  const order = await loadOrder(orderId);
  const firstName = order.customer_name.split(" ")[0];
  const itemsHtml = (order.items as any[])
    .map((it) => `<div class="item"><p style="margin:0;font-weight:600;">${it.qty}× ${it.name}</p><p class="muted" style="margin:4px 0 0;">${formatBRL(it.total_cents)}</p></div>`)
    .join("");
  const addr = order.customer_address as any;
  const addressHtml = addr?.street
    ? `<p><span class="label">Entrega</span><br/>${[addr.street, addr.number, addr.complement, addr.district, addr.city ? `${addr.city}/${addr.state ?? ""}` : null, addr.cep].filter(Boolean).join(", ")}</p>`
    : "";
  const method = order.payment_method_type === "pix" ? "PIX" : order.payment_method_type === "credit_card" ? "Cartão de crédito" : "";

  const customerHtml = wrap(`
    <div class="card">
      <h1>Pagamento aprovado! 🎉</h1>
      ${progressBar(1)}
      <p>Olá ${firstName}, o pagamento do pedido <span class="code">#${order.code}</span> foi confirmado${method ? ` (${method})` : ""}. Agora a gente separa seus produtos com carinho e te avisa a cada etapa até chegar na sua casa.</p>
      <h2>Resumo</h2>
      ${itemsHtml}
      <div class="total-row"><span>Total pago</span><span>${formatBRL(order.total_cents)}</span></div>
      ${addressHtml}
      <a class="btn" href="${orderLink(order)}">Acompanhar pedido</a>
    </div>
  `);

  const elisaHtml = wrap(`
    <div class="card">
      <h1>💰 Pedido pago: #${order.code}</h1>
      <p><span class="label">Cliente</span><br/>${order.customer_name}<br/>${order.customer_email}<br/>${order.customer_phone}</p>
      ${addressHtml}
      ${order.shipping_service_label ? `<p><span class="label">Frete escolhido</span><br/>${order.shipping_service_label} · ${formatBRL(order.shipping_cents)}</p>` : ""}
      ${order.notes ? `<p><span class="label">Observações</span><br/>"${order.notes}"</p>` : ""}
      <h2>Itens</h2>
      ${itemsHtml}
      <div class="total-row"><span>Total</span><span>${formatBRL(order.total_cents)}</span></div>
      <p><strong>Próximo passo:</strong> emitir a NF-e e comprar a etiqueta no painel.</p>
      <a class="btn" href="${SITE_URL}/admin/pedidos">Preparar envio</a>
    </div>
  `);

  const tasks: Promise<unknown>[] = [
    sendEmail(ELISA_EMAIL, `💰 Pedido pago #${order.code} · ${order.customer_name} · ${formatBRL(order.total_cents)}`, elisaHtml)
      .catch((e) => console.error("elisa paid email failed:", e)),
  ];
  if (await wantsOrderUpdates(order.user_id)) {
    tasks.push(sendEmail(order.customer_email, `Pagamento aprovado · pedido #${order.code} 🎉`, customerHtml)
      .catch((e) => console.error("paid customer email failed:", e)));
  }
  await Promise.all(tasks);
}

async function handleOrderInTransit(orderId: string) {
  const order = await loadOrder(orderId);
  const firstName = order.customer_name.split(" ")[0];
  const customerHtml = wrap(`
    <div class="card">
      <h1>Seu pedido está a caminho 🚚</h1>
      ${progressBar(4)}
      <p>Olá ${firstName}, a transportadora já recebeu o pedido <span class="code">#${order.code}</span> e ele está em trânsito até você.</p>
      ${order.tracking_code ? `<p><span class="label">Código de rastreio</span><br/><span class="code">${order.tracking_code}</span></p>
      <a class="btn" href="${trackingUrl(order.tracking_code)}">Rastrear entrega</a>` : ""}
      <p class="muted">${order.shipping_service_label ? `Envio via ${order.shipping_service_label}. ` : ""}Qualquer dúvida, é só responder este e-mail.</p>
    </div>
  `);
  if (!(await wantsOrderUpdates(order.user_id))) return;
  await sendEmail(order.customer_email, `Seu pedido #${order.code} está a caminho 🚚`, customerHtml)
    .catch((e) => console.error("in-transit email failed:", e));
}

async function handleOrderDeliveryIssue(orderId: string) {
  const order = await loadOrder(orderId);
  const firstName = order.customer_name.split(" ")[0];
  const customerHtml = wrap(`
    <div class="card">
      <h1>Houve um problema na entrega</h1>
      ${progressBar(4)}
      <p>Olá ${firstName}, a transportadora não conseguiu concluir a entrega do pedido <span class="code">#${order.code}</span>. Não se preocupe — a gente já está acompanhando e vai te chamar pra resolver.</p>
      ${order.tracking_code ? `<a class="btn" href="${trackingUrl(order.tracking_code)}">Ver rastreio</a>` : ""}
      <p class="muted">Se preferir, responda este e-mail ou chame no WhatsApp.</p>
    </div>
  `);
  const elisaHtml = wrap(`
    <div class="card">
      <h1>⚠️ Falha na entrega: #${order.code}</h1>
      <p>${order.customer_name} · ${order.customer_email} · ${order.customer_phone}</p>
      ${order.tracking_code ? `<p>Rastreio: <span class="code">${order.tracking_code}</span></p>` : ""}
      <a class="btn" href="${SITE_URL}/admin/pedidos">Abrir pedido</a>
    </div>
  `);
  await Promise.all([
    sendEmail(ELISA_EMAIL, `⚠️ Falha na entrega · pedido #${order.code}`, elisaHtml).catch((e) => console.error(e)),
    (await wantsOrderUpdates(order.user_id))
      ? sendEmail(order.customer_email, `Atualização sobre a entrega do pedido #${order.code}`, customerHtml).catch((e) => console.error(e))
      : Promise.resolve(),
  ]);
}

async function handleCourseCompleted(certificateId: string) {
  const { data: cert, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", certificateId)
    .maybeSingle();
  if (error || !cert) throw new Error("certificate not found");

  const { data: authUser } = await supabase.auth.admin.getUserById(cert.user_id);
  const studentEmail = authUser?.user?.email;

  const certUrl = `${SITE_URL}/certificado/${cert.code}`;

  if (studentEmail) {
    const studentHtml = wrap(`
      <div class="card">
        <h1>Parabéns! 🌿</h1>
        <p>Você concluiu o curso</p>
        <h2>${cert.course_title}</h2>
        <p>Seu certificado já está disponível com código <span class="code">#${cert.code}</span></p>
        <a class="btn" href="${certUrl}">Ver meu certificado</a>
        <p class="muted">Link público pra compartilhar nas redes:<br/>${certUrl}</p>
      </div>
    `);
    await sendEmail(studentEmail, `🎉 Você concluiu ${cert.course_title}!`, studentHtml).catch((e) => console.error("student email failed:", e));
  }

  const elisaHtml = wrap(`
    <div class="card">
      <h1>Aluna concluiu o curso</h1>
      <p><span class="label">Aluna</span><br/>${cert.student_name}</p>
      <p><span class="label">Curso</span><br/>${cert.course_title}</p>
      <p><span class="label">Certificado</span> <span class="code">#${cert.code}</span></p>
      <a class="btn" href="${SITE_URL}/certificado/${cert.code}">Ver certificado</a>
    </div>
  `);
  await sendEmail(ELISA_EMAIL, `✓ Aluna concluiu curso: ${cert.student_name} · ${cert.course_title}`, elisaHtml).catch((e) => console.error("elisa course email failed:", e));
}

async function handleCoursePurchased(enrollmentId: string) {
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select("*, course:courses(id, slug, title, cover_image)")
    .eq("id", enrollmentId)
    .maybeSingle();
  if (error || !enrollment) throw new Error("enrollment not found");

  const { data: authUser } = await supabase.auth.admin.getUserById(enrollment.user_id);
  const studentEmail = authUser?.user?.email;
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", enrollment.user_id).maybeSingle();
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Aluna";

  const { data: firstLesson } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", enrollment.course_id)
    .order("display_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const accessUrl = firstLesson
    ? `${SITE_URL}/painel/aula/${firstLesson.id}`
    : `${SITE_URL}/cursos/${enrollment.course.slug}`;

  if (studentEmail) {
    const studentHtml = wrap(`
      <div class="card">
        <h1>Você está matriculada! 🌿</h1>
        <p>Olá ${firstName}, seu pagamento foi confirmado.</p>
        <h2>${enrollment.course.title}</h2>
        <p>Seu acesso está liberado e disponível pra começar agora.</p>
        <a class="btn" href="${accessUrl}">Acessar curso</a>
        <p class="muted">Boas práticas: assista numa hora tranquila, sem pressa. As aulas ficam disponíveis pra sempre.</p>
      </div>
    `);
    await sendEmail(studentEmail, `🎉 Você está matriculada em ${enrollment.course.title}`, studentHtml).catch((e) => console.error("student course email failed:", e));
  }

  const elisaHtml = wrap(`
    <div class="card">
      <h1>Nova matrícula paga</h1>
      <p><span class="label">Aluna</span><br/>${profile?.full_name ?? studentEmail ?? "Sem nome"}</p>
      <p><span class="label">Curso</span><br/>${enrollment.course.title}</p>
      <p><span class="label">Valor pago</span> ${formatBRL(enrollment.paid_cents ?? 0)}</p>
      <a class="btn" href="${SITE_URL}/admin/cursos">Abrir admin</a>
    </div>
  `);
  await sendEmail(ELISA_EMAIL, `✓ Matrícula paga: ${profile?.full_name ?? studentEmail} · ${enrollment.course.title}`, elisaHtml).catch((e) => console.error("elisa course email failed:", e));
}

async function handleOrderCancelled(orderId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) throw new Error("order not found");

  const itemsHtml = (order.items as any[])
    .map((it) => `<div class="item"><p style="margin:0;font-weight:600;">${it.qty}× ${it.name}</p></div>`)
    .join("");

  const elisaHtml = wrap(`
    <div class="card">
      <h1>Pedido cancelado pela cliente</h1>
      <p><span class="label">Cliente</span><br/>${order.customer_name}<br/>${order.customer_email}</p>
      <p><span class="label">Código</span> <span class="code">#${order.code}</span></p>
      <p><span class="label">Valor</span> ${formatBRL(order.total_cents)}</p>
      <h2>Itens</h2>
      ${itemsHtml}
      <a class="btn" href="${SITE_URL}/admin/pedidos">Abrir admin</a>
    </div>
  `);
  await sendEmail(ELISA_EMAIL, `✗ Pedido cancelado: #${order.code} · ${order.customer_name}`, elisaHtml)
    .catch((e) => console.error("cancel elisa email failed:", e));
}

async function handleOrderShipped(orderId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) throw new Error("order not found");

  const firstName = order.customer_name.split(" ")[0];
  const trackingBlock = order.tracking_code
    ? `<p><span class="label">Código de rastreio</span><br/><span class="code">${order.tracking_code}</span></p>
       <a class="btn" href="${trackingUrl(order.tracking_code)}">Rastrear pedido</a>`
    : `<p class="muted">O código de rastreio chega assim que a transportadora registrar o envio.</p>`;

  const customerHtml = wrap(`
    <div class="card">
      <h1>Seu pedido foi despachado! 📦</h1>
      ${progressBar(3)}
      <p>Olá ${firstName}, seu pedido <span class="code">#${order.code}</span> foi embalado e a etiqueta de envio já foi gerada. Em breve ele é postado e você recebe outro aviso quando estiver em trânsito.</p>
      ${trackingBlock}
      <p class="muted">Qualquer dúvida, é só responder este email ou chamar no WhatsApp.</p>
    </div>
  `);
  if (!(await wantsOrderUpdates(order.user_id))) return;
  await sendEmail(order.customer_email, `Seu pedido #${order.code} foi enviado 📦`, customerHtml)
    .catch((e) => console.error("shipped customer email failed:", e));
}

async function handleOrderCompleted(orderId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) throw new Error("order not found");

  const firstName = order.customer_name.split(" ")[0];

  const customerHtml = wrap(`
    <div class="card">
      <h1>Pedido entregue 🌿</h1>
      ${progressBar(5)}
      <p>Olá ${firstName}, seu pedido <span class="code">#${order.code}</span> foi entregue. Espero que você ame os produtos!</p>
      <p>Se puder, deixa uma avaliação na página do produto — me ajuda muito a continuar selecionando coisas boas pra você.</p>
      <a class="btn" href="${SITE_URL}/loja">Voltar pra loja</a>
      <p class="muted">Com carinho,<br/>Elisa</p>
    </div>
  `);
  if (!(await wantsOrderUpdates(order.user_id))) return;
  await sendEmail(order.customer_email, `Pedido #${order.code} entregue · obrigada 🌿`, customerHtml)
    .catch((e) => console.error("completed customer email failed:", e));
}

async function handleInvoiceReady(recordId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, code, customer_name, customer_email, user_id, base_invoice_number, base_invoice_danfe_url, base_invoice_xml_url, base_invoice_key")
    .eq("id", recordId)
    .maybeSingle();
  if (error || !order) throw new Error("order not found");
  if (!order.base_invoice_danfe_url) {
    console.warn(`Invoice ${recordId} sem DANFE URL, pulando email`);
    return;
  }

  const firstName = order.customer_name.split(" ")[0];
  const html = wrap(`
    <div class="card">
      <h1>Sua nota fiscal chegou 🌿</h1>
      ${progressBar(2)}
      <p>Olá ${firstName}, aqui está a NFe do seu pedido <span class="code">#${order.code}</span>.</p>
      ${order.base_invoice_number ? `<p><span class="label">Número da NFe</span> ${order.base_invoice_number}</p>` : ""}
      ${order.base_invoice_key ? `<p><span class="label">Chave de acesso</span><br/><span class="code" style="font-size:11px;word-break:break-all;">${order.base_invoice_key}</span></p>` : ""}
      <p style="margin-top:20px;">Você pode baixar o DANFE (PDF) e o XML nos botões abaixo:</p>
      <a class="btn" href="${order.base_invoice_danfe_url}">Baixar DANFE (PDF)</a>
      ${order.base_invoice_xml_url ? `<p style="margin-top:8px;"><a href="${order.base_invoice_xml_url}" style="color:#3E573F;font-size:13px;">Baixar XML</a></p>` : ""}
      <p class="muted" style="margin-top:24px;">Guarde esses arquivos — servem como comprovante fiscal.</p>
    </div>
  `);
  if (!(await wantsOrderUpdates(order.user_id))) return;
  await sendEmail(order.customer_email, `NFe #${order.base_invoice_number ?? order.code} disponível`, html)
    .catch((e) => console.error("invoice email failed:", e));
}

async function handleProjectRequest(recordId: string, payload?: any) {
  let request = payload;
  if (!request && recordId) {
    const { data } = await supabase
      .from("custom_project_requests")
      .select("*")
      .eq("id", recordId)
      .maybeSingle();
    request = data;
  }
  if (!request) throw new Error("project request not found");

  const elisaHtml = wrap(`
    <div class="card">
      <h1>🎯 Nova solicitação de projeto</h1>
      <p><span class="label">Cliente</span><br/>${request.name}<br/>${request.email}<br/>${request.whatsapp}</p>
      <p><span class="label">Empresa</span><br/>${request.company || "Não informada"}</p>
      <p><span class="label">Tipo de Projeto</span><br/>${request.project_type}</p>
      <h2>Brief / Descrição</h2>
      <p style="white-space:pre-line;">${request.brief}</p>
      ${request.quantity_estimate ? `<p><span class="label">Quantidade</span><br/>${request.quantity_estimate}</p>` : ""}
      ${request.deadline ? `<p><span class="label">Prazo</span><br/>${request.deadline}</p>` : ""}
      <a class="btn" href="${SITE_URL}/admin/solicitacoes">Ver no admin</a>
    </div>
  `);

  await sendEmail(ELISA_EMAIL, `🎯 Nova solicitação de projeto personalizado — ${request.name}`, elisaHtml);
}

async function handleWaitlistSignup(payload: any) {
  const elisaHtml = wrap(`
    <div class="card">
      <h1>🔔 Novo interessado na lista de espera</h1>
      <p><span class="label">Produto</span><br/>${payload.product_name}</p>
      <p><span class="label">Interessado</span><br/>${payload.email}<br/>${payload.whatsapp}</p>
      <a class="btn" href="${SITE_URL}/admin/produtos">Ver no admin</a>
    </div>
  `);

  await sendEmail(ELISA_EMAIL, `🔔 Novo interessado na lista de espera — ${payload.product_name}`, elisaHtml);
}

async function handleWaitlistRestock(productId: string) {
  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug")
    .eq("id", productId)
    .single();

  if (!product) throw new Error("Product not found for waitlist restock");

  const { data: subs } = await supabase
    .from("product_waitlist")
    .select("id, email")
    .eq("product_id", productId)
    .eq("notified", false);

  if (!subs || subs.length === 0) return { notified: 0 };

  for (const s of subs) {
    const html = wrap(`
      <div class="card">
        <h1>💛 ${product.name} já está disponível!</h1>
        <p>Boas notícias! O produto que você esperava voltou ao estoque:</p>
        <h2 style="margin: 20px 0;">${product.name}</h2>
        <a class="btn" href="${SITE_URL}/loja/${product.slug}">Garanta o seu agora →</a>
        <p style="margin-top: 24px;" class="muted">Corre que pode esgotar de novo. 💛<br/>Equipe BODYOGA</p>
      </div>
    `);

    await sendEmail(s.email, `💛 ${product.name} já está disponível!`, html)
      .catch(err => console.error(`Waitlist email to ${s.email} failed:`, err));
  }

  await supabase
    .from("product_waitlist")
    .update({ 
      notified: true, 
      notified_at: new Date().toISOString() 
    })
    .eq("product_id", productId)
    .eq("notified", false);

  return { notified: subs.length };
}

async function handleLowStock(productId: string) {
  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug, stock_qty, low_stock_threshold")
    .eq("id", productId)
    .single();
  if (!product || product.stock_qty === null) return { skipped: true };

  const esgotou = product.stock_qty <= 0;
  const html = wrap(`
    <div class="card">
      <h1>${esgotou ? "⛔ Produto esgotado" : "⚠️ Estoque baixo"}</h1>
      <h2 style="margin: 16px 0;">${product.name}</h2>
      <p><span class="label">Quantidade atual</span><br/>${product.stock_qty} unidade(s)</p>
      <p class="muted">${esgotou
        ? "O produto já aparece como esgotado na loja e as clientes podem entrar na lista de espera."
        : `Alerta configurado para ${product.low_stock_threshold} unidade(s) ou menos.`}</p>
      <a class="btn" href="${SITE_URL}/admin/estoque">Repor estoque</a>
    </div>
  `);
  await sendEmail(
    ELISA_EMAIL,
    `${esgotou ? "⛔ Esgotado" : "⚠️ Estoque baixo"} — ${product.name} (${product.stock_qty} un.)`,
    html,
  );
  return { ok: true };
}

async function handleNoticeLead(payload: any) {
  const elisaHtml = wrap(`
    <div class="card">
      <h1>🎯 Novo lead pelo aviso</h1>
      <p><span class="label">Aviso</span><br/>${payload.notice_title}</p>
      <p><span class="label">Página</span><br/>${payload.page || "/"}</p>
      <p><span class="label">Lead</span><br/>${payload.name || "Não informado"}<br/>${payload.email || "Não informado"}<br/>${payload.phone || "Não informado"}</p>
      <a class="btn" href="${SITE_URL}/admin/website/avisos">Ver leads no admin</a>
    </div>
  `);

  await sendEmail(ELISA_EMAIL, `🎯 Novo lead pelo aviso — ${payload.name || payload.email}`, elisaHtml);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await loadEmailBranding();
    const { type, record_id, payload } = await req.json();
    if (!type) {
      return new Response(JSON.stringify({ error: "type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any = { ok: true };

    if (type === "booking") await handleBooking(record_id);
    else if (type === "order") await handleOrder(record_id);
    else if (type === "course_completed") await handleCourseCompleted(record_id);
    else if (type === "order_cancelled") await handleOrderCancelled(record_id);
    else if (type === "order_paid") await handleOrderPaid(record_id);
    else if (type === "order_in_transit") await handleOrderInTransit(record_id);
    else if (type === "order_delivery_issue") await handleOrderDeliveryIssue(record_id);
    else if (type === "order_shipped") await handleOrderShipped(record_id);
    else if (type === "order_completed") await handleOrderCompleted(record_id);
    else if (type === "course_purchased") await handleCoursePurchased(record_id);
    else if (type === "invoice_ready") await handleInvoiceReady(record_id);
    else if (type === "project_request") await handleProjectRequest(record_id, payload);
    else if (type === "waitlist_signup") await handleWaitlistSignup(payload);
    else if (type === "waitlist_restock") result = await handleWaitlistRestock(payload?.product_id || record_id);
    else if (type === "low_stock") result = await handleLowStock(record_id);
    else if (type === "notice_lead") await handleNoticeLead(payload);
    else
      return new Response(JSON.stringify({ error: "unknown type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
