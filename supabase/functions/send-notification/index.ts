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

const FROM = "Elisa Hoeppers <agendamento@sendmail.elisahoeppers.com.br>";
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
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head><body><div class="container">${body}<p class="muted" style="text-align:center;margin-top:24px;">elisahoeppers.com.br</p></div></body></html>`;
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

  const customerHtml = wrap(`
    <div class="card">
      <h1>Pedido recebido!</h1>
      <p>Olá ${firstName}, seu pedido foi registrado. A Elisa entra em contato em até 24h pra combinar o pagamento e o frete.</p>
      <h2>Seu pedido</h2>
      ${itemsHtml}
      <div class="total-row"><span>Total</span><span>${formatBRL(order.total_cents)}</span></div>
      <p class="muted">Frete combinado por WhatsApp</p>
      <p><span class="label">Código</span> <span class="code">#${order.code}</span></p>
      <a class="btn" href="${SITE_URL}/pedido/${order.code}">Ver pedido</a>
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
