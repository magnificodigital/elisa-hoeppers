// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const PAGARME_SECRET_KEY = (Deno.env.get("PAGARME_SECRET_KEY") ?? "").trim();
// @ts-ignore
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://bodyogaoficial.com.br").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Sandbox quando a chave é de teste; produção caso contrário.
const PAGARME_BASE = PAGARME_SECRET_KEY.startsWith("sk_test_")
  ? "https://sdx-api.pagar.me/core/v5"
  : "https://api.pagar.me/core/v5";

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
      .select("id, code, total_cents, status, customer_name, customer_email, customer_phone, customer_address")
      .eq("code", order_code)
      .maybeSingle();

    if (orderErr || !order) return json({ error: "Pedido não encontrado" }, 404);
    if (order.status !== "pending") {
      return json({ error: "Este pedido não está mais aguardando pagamento." }, 400);
    }

    const total = Math.max(100, Math.round(order.total_cents)); // Pagar.me exige >= R$1,00
    const cpf = String((order.customer_address as any)?.cpf_cnpj ?? "").replace(/\D/g, "");
    const phone = String(order.customer_phone ?? "").replace(/\D/g, "");

    // Parcelas sem juros (total igual em todas)
    const maxInstallments = Math.min(12, Math.max(1, Math.floor(total / 500)));
    const installments = Array.from({ length: maxInstallments }, (_, i) => ({
      number: i + 1,
      total,
    }));

    const payload: Record<string, unknown> = {
      code: order.code,
      // Item único = total do pedido (garante o valor exato, já com frete e desconto).
      items: [
        {
          amount: total,
          description: `Pedido #${order.code} — BODYOGA`,
          quantity: 1,
          code: order.code,
        },
      ],
      customer: {
        name: order.customer_name || "Cliente",
        email: order.customer_email,
        type: "individual",
        ...(cpf.length >= 11 ? { document: cpf, document_type: "CPF" } : {}),
        ...(phone.length >= 10
          ? {
              phones: {
                mobile_phone: {
                  country_code: "55",
                  area_code: phone.slice(0, 2),
                  number: phone.slice(2),
                },
              },
            }
          : {}),
      },
      payments: [
        {
          payment_method: "checkout",
          checkout: {
            expires_in: 3600,
            default_payment_method: "credit_card",
            accepted_payment_methods: ["credit_card", "pix"],
            success_url: `${SITE_URL}/pedido/${order.code}`,
            customer_editable: true,
            skip_checkout_success_page: true,
            credit_card: {
              installments,
              statement_descriptor: "BODYOGA",
            },
            pix: { expires_in: 3600 },
          },
        },
      ],
      metadata: { order_code: order.code, order_id: order.id },
    };

    const resp = await fetch(`${PAGARME_BASE}/orders`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("pagarme create order failed:", resp.status, JSON.stringify(data));
      return json({ error: data?.message || "Falha ao criar o checkout na Pagar.me.", detail: data }, 502);
    }

    // A URL de pagamento vem em checkouts[0].payment_url
    const checkout = Array.isArray(data?.checkouts) ? data.checkouts[0] : null;
    const paymentUrl = checkout?.payment_url;
    if (!paymentUrl) {
      console.error("pagarme: sem payment_url na resposta:", JSON.stringify(data));
      return json({ error: "Checkout criado mas sem URL de pagamento.", detail: data }, 502);
    }

    // Conciliação é feita pelo webhook via order.code / metadata.order_code.
    return json({ payment_url: paymentUrl, pagarme_order_id: data.id });
  } catch (err) {
    console.error("pagarme-create-checkout error:", err);
    return json({ error: (err as Error).message ?? "Erro inesperado" }, 500);
  }
});
