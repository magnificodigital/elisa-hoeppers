// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const PAGARME_SECRET_KEY = (Deno.env.get("PAGARME_SECRET_KEY") ?? "").trim();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const PAGARME_BASE = "https://api.pagar.me/core/v5";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Dados do cliente pra pré-preencher o checkout (evita redigitar). */
function buildCustomer(order: any) {
  const doc = String(order.customer_address?.cpf_cnpj ?? "").replace(/\D/g, "");
  const phone = String(order.customer_phone ?? "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  const a = order.customer_address ?? {};
  const customer: Record<string, unknown> = {
    name: order.customer_name,
    email: order.customer_email,
    type: doc.length === 14 ? "company" : "individual",
  };
  if (doc.length === 11 || doc.length === 14) {
    customer.document = doc;
    customer.document_type = doc.length === 14 ? "CNPJ" : "CPF";
  }
  if (phone.length >= 10) {
    customer.phones = { mobile_phone: { country_code: "55", area_code: phone.slice(0, 2), number: phone.slice(2) } };
  }
  const cep = String(a.cep ?? "").replace(/\D/g, "");
  if (a.street && cep.length === 8 && a.city && a.state) {
    customer.address = {
      line_1: [a.number, a.street, a.district].filter(Boolean).join(", "),
      line_2: a.complement || undefined,
      zip_code: cep,
      city: a.city,
      state: String(a.state).slice(0, 2).toUpperCase(),
      country: "BR",
    };
  }
  return customer;
}

async function createLink(payload: Record<string, unknown>) {
  const resp = await fetch(`${PAGARME_BASE}/paymentlinks`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${PAGARME_SECRET_KEY}:`), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: resp.ok, status: resp.status, data: await resp.json().catch(() => ({})) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!PAGARME_SECRET_KEY) {
      return json({ error: "PAGARME_SECRET_KEY não configurada nos secrets do Supabase." }, 400);
    }

    const { order_code } = await req.json();
    if (!order_code) return json({ error: "order_code ausente" }, 400);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, code, total_cents, status, customer_name, customer_email, customer_phone, customer_address")
      .eq("code", order_code)
      .maybeSingle();

    if (orderErr || !order) return json({ error: "Pedido não encontrado" }, 404);
    if (order.status !== "pending") {
      return json({ error: "Este pedido não está mais aguardando pagamento." }, 400);
    }

    const total = Math.max(100, Math.round(order.total_cents)); // Pagar.me exige >= R$1,00
    // Parcelas sem juros, parcela mínima de R$ 5,00, até 12x.
    const maxInstallments = Math.min(12, Math.max(1, Math.floor(total / 500)));
    const installments = Array.from({ length: maxInstallments }, (_, i) => ({ number: i + 1, total }));

    // Rota liberada nesta conta: Link de Pagamento (cartão, PIX, Apple Pay, Google Pay).
    const base = {
      is_building: false,
      type: "order",
      name: `Pedido #${order.code} — BODYOGA`,
      max_paid_sessions: 1, // o mesmo link não pode ser pago duas vezes
      metadata: { order_code: order.code, order_id: order.id },
      payment_settings: {
        accepted_payment_methods: ["credit_card", "pix"],
        credit_card_settings: { operation_type: "auth_and_capture", installments },
        pix_settings: { expires_in: 3600 },
      },
      cart_settings: {
        items: [{ name: `Pedido #${order.code} — BODYOGA`, amount: total, default_quantity: 1 }],
      },
    };

    // 1ª tentativa com o cliente pré-preenchido; se a Pagar.me recusar algum dado, cria sem.
    let r = await createLink({ ...base, customer_settings: { customer: buildCustomer(order) } });
    if (!r.ok && r.status >= 400 && r.status < 500) {
      console.warn("paymentlink com cliente recusado, tentando sem:", r.status, JSON.stringify(r.data).slice(0, 400));
      r = await createLink(base);
    }
    if (!r.ok) {
      console.error("pagarme paymentlink failed:", r.status, JSON.stringify(r.data));
      return json({ error: r.data?.message || "Falha ao criar o link de pagamento na Pagar.me.", detail: r.data }, 502);
    }

    const linkId: string | undefined = r.data?.id;
    const paymentUrl: string | undefined = r.data?.url;
    if (!linkId || !paymentUrl) {
      return json({ error: "Link criado mas sem URL de pagamento.", detail: r.data }, 502);
    }

    // Guarda o id do link: pedidos pagos via link voltam no webhook com code = "pl_...".
    await supabase
      .from("orders")
      .update({ payment_method: "pagarme", payment_preference_id: linkId })
      .eq("id", order.id);

    // E-mail "Recebemos seu pedido" já com o botão de finalizar pagamento.
    await supabase.functions
      .invoke("send-notification", { body: { type: "order", record_id: order.id } })
      .catch((e) => console.error("order email failed:", e));

    return json({ payment_url: paymentUrl, pagarme_link_id: linkId });
  } catch (err) {
    console.error("pagarme-create-checkout error:", err);
    return json({ error: (err as Error).message ?? "Erro inesperado" }, 500);
  }
});
