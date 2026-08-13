// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://hoepppers.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return ((data?.value as string | null) ?? null)?.trim() || null;
}

// Access Token: tabela segura (gerenciada pelo admin) → env → app_settings (legado)
async function getAccessToken(): Promise<string> {
  const { data } = await supabase
    .from("payment_secrets")
    .select("value")
    .eq("key", "mp_access_token")
    .maybeSingle();
  const fromDb = (data?.value as string | undefined)?.trim();
  if (fromDb) return fromDb;
  // @ts-ignore - Deno
  const fromEnv = (Deno.env.get("MP_ACCESS_TOKEN") ?? "").trim();
  if (fromEnv) return fromEnv;
  return (await getSetting("mp_access_token")) ?? "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Access Token do Mercado Pago não configurado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { order_id, order_code, device_id } = body;

    // MODO PROCESSAR PAGAMENTO (chamado pelo Payment Brick)
    if (body.action === "process") {
      const { formData, selectedPaymentMethod } = body;
      if (!order_code || !formData) {
        return new Response(JSON.stringify({ error: "dados incompletos" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2a) Busca os itens do pedido (pra montar additional_info.items)
      const { data: order } = await supabase
        .from("orders")
        .select("id, code, total_cents, status, customer_name, customer_email, customer_phone, shipping_cents, customer_address")
        .eq("code", order_code)
        .maybeSingle();
        
      if (!order) {
        return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Os itens estão na coluna 'items' (jsonb) da tabela 'orders'
      const items = (order.items ?? []) as any[];


      if (order.status === "confirmed") {
        return new Response(JSON.stringify({ status: "approved", already: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Documento (CPF) — vem do formData ou do endereço
      const addr = (order.customer_address ?? {}) as any;
      const cpf = formData.payer?.identification?.number ?? addr.cpf_cnpj ?? "";

      // Nome do pagador separado
      const fullName = (order.customer_name ?? "").trim();
      const firstName = fullName.split(" ")[0] ?? "";
      const lastName = fullName.split(" ").slice(1).join(" ") || firstName;

      const additional_info: Record<string, unknown> = {
        items: (items ?? []).map((it) => ({
          id: String(it.product_id),
          title: it.name ?? it.title ?? `Produto ${it.product_id}`,
          quantity: it.qty,
          unit_price: (it.unit_price_cents ?? 0) / 100,
          category_id: "others",
        })),
        payer: {
          first_name: firstName,
          last_name: lastName,
          phone: order.customer_phone ? { number: String(order.customer_phone).replace(/\D/g, "") } : undefined,
          address: addr.cep ? {
            zip_code: String(addr.cep).replace(/\D/g, ""),
            street_name: addr.street ?? "",
            street_number: addr.number ? Number(String(addr.number).replace(/\D/g, "")) || undefined : undefined,
          } : undefined,
        },
        shipments: order.shipping_cents ? { receiver_address: {
          zip_code: String(addr.cep ?? "").replace(/\D/g, ""),
          street_name: addr.street ?? "",
          street_number: addr.number ? Number(String(addr.number).replace(/\D/g, "")) || undefined : undefined,
        }} : undefined,
      };

      const payBody: any = {
        transaction_amount: Number(formData.transaction_amount ?? order.total_cents / 100),
        description: `Pedido ${order.code} - BODYOGA`,
        payment_method_id: formData.payment_method_id,
        payer: {
          ...formData.payer,
          first_name: formData.payer?.first_name ?? firstName,
          last_name: formData.payer?.last_name ?? lastName,
        },
        external_reference: order.code,
        statement_descriptor: "BODYOGA",
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
        additional_info,
        metadata: { order_code: order.code },
        ...(formData.token ? { token: formData.token } : {}),
        ...(formData.installments ? { installments: formData.installments } : {}),
        ...(formData.issuer_id ? { issuer_id: formData.issuer_id } : {}),
      };

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${order.code}-${Date.now()}`,
      };
      
      // Device ID — item de MAIOR peso no score de qualidade
      if (device_id) headers["X-meli-session-id"] = device_id;

      const payResp = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers,
        body: JSON.stringify(payBody),
      });
      const payment = await payResp.json();
      if (!payResp.ok) {
        console.error("MP payment error:", payment);
        return new Response(JSON.stringify({ error: payment.message ?? "Falha no Mercado Pago" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("orders")
        .update({
          mp_payment_id: String(payment.id),
          mp_payment_status: payment.status,
          mp_payment_status_detail: payment.status_detail,
          mp_payment_method: payment.payment_method_id,
          status: payment.status === "approved" ? "confirmed" : order.status,
        })
        .eq("id", order.id);

      const result: any = {
        status: payment.status,
        status_detail: payment.status_detail,
        id: payment.id,
      };
      const tx = payment.point_of_interaction?.transaction_data;
      if (tx) {
        result.pix = {
          qr_code: tx.qr_code,
          qr_base64: tx.qr_code_base64,
          ticket_url: tx.ticket_url,
        };
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fluxo de criação de Preferência (se houver order_id/order_code)
    if (!order_id && !order_code) throw new Error("order_id ou order_code obrigatório");

    const q = supabase.from("orders").select("*");
    const { data: order, error } = await (order_id ? q.eq("id", order_id) : q.eq("code", order_code)).maybeSingle();
    if (error || !order) throw new Error("Pedido não encontrado");
    if (order.status !== "pending") throw new Error("Pedido não está pendente");

    // Idempotência
    if (order.mp_preference_id) {
      return new Response(JSON.stringify({
        ok: true,
        preference_id: order.mp_preference_id,
        already_created: true,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const itemsFromDb = (order.items ?? []) as any[];


    const items = (itemsFromDb ?? []).map((it) => ({
      id: String(it.product_id),
      title: it.name ?? it.title ?? "Produto",
      quantity: it.qty,
      unit_price: it.unit_price_cents / 100,
      currency_id: "BRL",
    }));

    if (order.shipping_cents && order.shipping_cents > 0) {
      items.push({
        id: "shipping",
        title: `Frete · ${order.shipping_service_label ?? "Envio"}`,
        quantity: 1,
        unit_price: order.shipping_cents / 100,
        currency_id: "BRL",
      });
    }

    const addr = (order.customer_address as any) ?? {};
    const cleanPhone = String(order.customer_phone ?? "").replace(/\D/g, "");
    const areaCode = cleanPhone.slice(0, 2);
    const phoneNumber = cleanPhone.slice(2);

    const payer: any = {
      email: order.customer_email,
      first_name: order.customer_name.split(" ")[0],
      last_name: order.customer_name.split(" ").slice(1).join(" ") || " ",
      phone: { area_code: areaCode, number: phoneNumber },
    };

    if (addr.cpf_cnpj || addr.document) {
      const doc = String(addr.cpf_cnpj ?? addr.document).replace(/\D/g, "");
      payer.identification = {
        type: doc.length === 11 ? "CPF" : "CNPJ",
        number: doc,
      };
    }

    if (addr.street && addr.city) {
      payer.address = {
        zip_code: String(addr.cep ?? "").replace(/\D/g, ""),
        street_name: addr.street,
        street_number: String(addr.number ?? "S/N"),
        neighborhood: addr.district ?? "",
        city: addr.city ?? "",
        federal_unit: addr.state ?? "",
      };
    }

    const preferencePayload: any = {
      items,
      payer,
      external_reference: order.id,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      statement_descriptor: "BODYOGA",
      metadata: { order_code: order.code },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
        default_installments: 1,
      },
      back_urls: {
        success: `${SITE_URL}/pedido/${order.code}?status=success`,
        pending: `${SITE_URL}/pedido/${order.code}?status=pending`,
        failure: `${SITE_URL}/pedido/${order.code}?status=failure`,
      },
      auto_return: "approved",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!mpRes.ok) {
      const errTxt = await mpRes.text();
      console.error("MP error", mpRes.status, errTxt);
      throw new Error(`MP ${mpRes.status}: ${errTxt.slice(0, 400)}`);
    }
    const preference = await mpRes.json();

    await supabase.from("orders").update({
      payment_method: "mercadopago",
      mp_preference_id: preference.id,
      payment_preference_id: preference.id,
    }).eq("id", order.id);

    return new Response(JSON.stringify({
      ok: true,
      preference_id: preference.id,
      init_point: preference.init_point,
    }), {
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
