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
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://hoepppers.lovable.app";

const FROM = "BODYOGA <contato@bodyogaoficial.com.br>";
const REPLY_TO = ELISA_EMAIL;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #F5EBE2; color: #334C31; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 0 auto; padding: 24px; }
  .card { background: white; border-radius: 12px; padding: 32px; margin-top: 16px; }
  h1 { font-family: Georgia, serif; color: #3B4F30; font-size: 28px; margin: 0 0 8px; }
  h2 { font-family: Georgia, serif; color: #3B4F30; font-size: 20px; margin: 24px 0 12px; }
  p { line-height: 1.6; margin: 8px 0; }
  .label { color: #7A7A7A; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
  .code { font-family: Menlo, monospace; background: #F5EBE2; padding: 4px 10px; border-radius: 4px; font-size: 14px; }
  .btn { display: inline-block; background: #3B4F30; color: white; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; font-size: 12px; margin-top: 16px; }
  .item { padding: 12px 0; border-bottom: 1px solid #DBCCBF; }
  .item:last-child { border-bottom: none; }
  .total-row { display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #DBCCBF; margin-top: 12px; font-weight: 600; }
  .muted { color: #7A7A7A; font-size: 13px; }
`;

function wrap(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head><body><div class="container">${body}<p class="muted" style="text-align:center;margin-top:24px;">bodyogaoficial.com.br</p></div></body></html>`;
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

  const customerHtml = wrap(`
    <div class="card">
      <h1>Pedido recebido!</h1>
      <p>Olá ${firstName}, seu pedido foi registrado. A Elisa entra em contato em até 24h pra combinar o pagamento${order.shipping_cents > 0 ? "" : " e o frete"}.</p>
      <h2>Seu pedido</h2>
      ${itemsHtml}
      <div class="total-row" style="font-weight:400;"><span>Subtotal</span><span>${formatBRL(order.subtotal_cents)}</span></div>
      ${shippingLine}
      <div class="total-row"><span>Total</span><span>${formatBRL(order.total_cents)}</span></div>
      <p><span class="label">Código</span> <span class="code">#${order.code}</span></p>
      ${accountCta}
    </div>
  `);



  const elisaHtml = wrap(`
    <div class="card">
      <h1>Novo pedido: #${order.code}</h1>
      <p><span class="label">Cliente</span><br/>${order.customer_name}<br/>${order.customer_email}<br/>${order.customer_phone}</p>
      ${addressHtml}
      ${order.notes ? `<p><span class="label">Observações</span><br/>"${order.notes}"</p>` : ""}
      <h2>Itens</h2>
      ${itemsHtml}
      <div class="total-row"><span>Total</span><span>${formatBRL(order.total_cents)}</span></div>
      <a class="btn" href="${SITE_URL}/admin/pedidos">Abrir admin</a>
    </div>
  `);

  await Promise.all([
    sendEmail(order.customer_email, `Seu pedido #${order.code} foi recebido 📦`, customerHtml).catch((e) => console.error("customer email failed:", e)),
    sendEmail(ELISA_EMAIL, `Novo pedido: ${order.customer_name} · ${formatBRL(order.total_cents)}`, elisaHtml).catch((e) => console.error("elisa email failed:", e)),
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
       <a class="btn" href="https://rastreamento.correios.com.br/app/index.php?objeto=${order.tracking_code}">Rastrear nos Correios</a>`
    : `<p class="muted">A Elisa vai te mandar o código de rastreio em breve por WhatsApp.</p>`;

  const customerHtml = wrap(`
    <div class="card">
      <h1>Seu pedido foi enviado! 📦</h1>
      <p>Olá ${firstName}, seu pedido <span class="code">#${order.code}</span> acabou de sair pra entrega.</p>
      ${trackingBlock}
      <p class="muted">Qualquer dúvida, é só responder este email ou chamar no WhatsApp.</p>
    </div>
  `);
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
      <h1>Pedido concluído 🌿</h1>
      <p>Olá ${firstName}, seu pedido <span class="code">#${order.code}</span> foi finalizado. Espero que você ame os produtos!</p>
      <p>Se puder, deixa uma avaliação na página do produto — me ajuda muito a continuar selecionando coisas boas pra você.</p>
      <a class="btn" href="${SITE_URL}/loja">Voltar pra loja</a>
      <p class="muted">Com carinho,<br/>Elisa</p>
    </div>
  `);
  await sendEmail(order.customer_email, `Pedido #${order.code} concluído · obrigada 🌿`, customerHtml)
    .catch((e) => console.error("completed customer email failed:", e));
}




serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, record_id } = await req.json();
    if (!type || !record_id) {
      return new Response(JSON.stringify({ error: "type and record_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (type === "booking") await handleBooking(record_id);
    else if (type === "order") await handleOrder(record_id);
    else if (type === "course_completed") await handleCourseCompleted(record_id);
    else if (type === "order_cancelled") await handleOrderCancelled(record_id);
    else if (type === "order_shipped") await handleOrderShipped(record_id);
    else if (type === "order_completed") await handleOrderCompleted(record_id);
    else if (type === "course_purchased") await handleCoursePurchased(record_id);
    else
      return new Response(JSON.stringify({ error: "unknown type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    return new Response(JSON.stringify({ ok: true }), {
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
