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

function authHeader(): string {
  return "Basic " + btoa(`${PAGARME_SECRET_KEY}:`);
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
      .select("id, code, total_cents, status")
      .eq("code", order_code)
      .maybeSingle();

    if (orderErr || !order) return json({ error: "Pedido não encontrado" }, 404);
    if (order.status !== "pending") {
      return json({ error: "Este pedido não está mais aguardando pagamento." }, 400);
    }

    const total = Math.max(100, Math.round(order.total_cents)); // Pagar.me exige >= R$1,00
    const maxInstallments = Math.min(12, Math.max(1, Math.floor(total / 500)));
    const installments = Array.from({ length: maxInstallments }, (_, i) => ({ number: i + 1, total }));

    // Rota certa desta conta: Link de Pagamento (/paymentlinks) — cartão, PIX, Apple Pay, Google Pay.
    const payload = {
      is_building: false,
      type: "order",
      name: `Pedido #${order.code} — BODYOGA`,
      expires_in: 3600,
      metadata: { order_code: order.code, order_id: order.id },
      payment_settings: {
        accepted_payment_methods: ["credit_card", "pix"],
        credit_card_settings: { operation_type: "auth_and_capture", installments },
        pix_settings: { expires_in: 3600 },
      },
      cart_settings: {
        items: [
          { name: `Pedido #${order.code} — BODYOGA`, amount: total, default_quantity: 1 },
        ],
      },
    };

    const resp = await fetch(`${PAGARME_BASE}/paymentlinks`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error("pagarme paymentlink failed:", resp.status, JSON.stringify(data));
      return json({ error: data?.message || "Falha ao criar o link de pagamento na Pagar.me.", detail: data }, 502);
    }

    const paymentUrl = data?.url;
    if (!paymentUrl) {
      console.error("pagarme: sem url na resposta:", JSON.stringify(data));
      return json({ error: "Link criado mas sem URL de pagamento.", detail: data }, 502);
    }

    // Conciliação é feita pelo webhook via metadata.order_code (propagado ao pedido).
    return json({ payment_url: paymentUrl, pagarme_link_id: data.id });
  } catch (err) {
    console.error("pagarme-create-checkout error:", err);
    return json({ error: (err as Error).message ?? "Erro inesperado" }, 500);
  }
});
