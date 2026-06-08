// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string) ?? null;
}

function meBase(env: string): string {
  return env === "production"
    ? "https://melhorenvio.com.br/api/v2"
    : "https://sandbox.melhorenvio.com.br/api/v2";
}

const UA = "Elisa Hoeppers Site (willy@magnificodigital.com)";

async function meCall(path: string, env: string, token: string, body?: any) {
  const res = await fetch(`${meBase(env)}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`ME ${path} ${res.status}: ${txt.slice(0, 400)}`);
  return JSON.parse(txt);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = await getSetting("me_access_token");
    const env = (await getSetting("me_environment")) ?? "sandbox";
    if (!token) throw new Error("ME token ausente");

    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id obrigatório");

    const { data: order, error } = await supabase.from("orders").select("*").eq("id", order_id).maybeSingle();
    if (error || !order) throw new Error("pedido não encontrado");
    if (!order.shipping_service_id) throw new Error("pedido sem serviço de frete escolhido");
    if (order.me_order_id) throw new Error("etiqueta já comprada pra esse pedido");

    const senderName = await getSetting("me_sender_name");
    const senderDoc = await getSetting("me_sender_document");
    const senderPhone = await getSetting("me_sender_phone");
    const senderEmail = await getSetting("me_sender_email");
    const senderCep = await getSetting("me_origin_cep");
    const senderStreet = await getSetting("me_origin_address");
    const senderNumber = await getSetting("me_sender_number");
    const senderDistrict = await getSetting("me_sender_district");
    const senderCityState = (await getSetting("me_sender_city_state")) ?? "";
    const [senderCity, senderState] = senderCityState.split("/").map((s) => s.trim());

    if (!senderName || !senderDoc || !senderPhone || !senderEmail || !senderCep || !senderCity || !senderState) {
      throw new Error("Dados do remetente incompletos. Vá em /admin/configuracoes seção Melhor Envio.");
    }

    const addr = order.customer_address as any;
    if (!addr || !addr.cep) throw new Error("Endereço da cliente incompleto");

    const ids = (order.items as any[]).map((i: any) => i.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, weight_g, length_cm, width_cm, height_cm")
      .in("id", ids);

    const defWeight = parseInt((await getSetting("me_default_weight_g")) ?? "300");
    const defLength = parseFloat((await getSetting("me_default_length_cm")) ?? "20");
    const defWidth = parseFloat((await getSetting("me_default_width_cm")) ?? "15");
    const defHeight = parseFloat((await getSetting("me_default_height_cm")) ?? "10");

    let totalWeight = 0;
    let maxL = 0, maxW = 0, maxH = 0;
    for (const it of order.items as any[]) {
      const p = (products ?? []).find((pp: any) => pp.id === it.product_id);
      const w = ((p?.weight_g ?? defWeight) * it.qty) / 1000;
      totalWeight += w;
      maxL = Math.max(maxL, p?.length_cm ?? defLength);
      maxW = Math.max(maxW, p?.width_cm ?? defWidth);
      maxH = Math.max(maxH, p?.height_cm ?? defHeight);
    }

    const meProducts = (order.items as any[]).map((it: any) => ({
      name: it.name,
      quantity: it.qty,
      unit_price: it.unit_price_cents / 100,
    }));

    const cartPayload = {
      service: parseInt(order.shipping_service_id),
      from: {
        name: senderName,
        phone: senderPhone,
        email: senderEmail,
        document: senderDoc.replace(/\D/g, ""),
        address: senderStreet ?? "",
        complement: "",
        number: senderNumber ?? "",
        district: senderDistrict ?? "",
        city: senderCity,
        country_id: "BR",
        postal_code: senderCep.replace(/\D/g, ""),
        state_abbr: senderState,
      },
      to: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        document: addr.document ?? "",
        address: addr.street ?? "",
        complement: addr.complement ?? "",
        number: addr.number ?? "",
        district: addr.district ?? "",
        city: addr.city ?? "",
        country_id: "BR",
        postal_code: String(addr.cep).replace(/\D/g, ""),
        state_abbr: addr.state ?? "",
      },
      products: meProducts,
      volumes: [{
        height: Math.max(2, maxH),
        width: Math.max(11, maxW),
        length: Math.max(16, maxL),
        weight: Math.max(0.1, totalWeight),
      }],
      options: {
        insurance_value: order.subtotal_cents / 100,
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: true,
      },
    };

    // 1) add to cart
    const cartRes = await meCall("/me/cart", env, token, cartPayload);
    const meOrderId = cartRes.id ?? cartRes.order_id;
    if (!meOrderId) throw new Error("ME não devolveu order_id");

    // 2) checkout (paga com saldo da carteira)
    await meCall("/me/shipment/checkout", env, token, { orders: [meOrderId] });

    // 3) generate (gera etiqueta)
    await meCall("/me/shipment/generate", env, token, { orders: [meOrderId] });

    // 4) print (pega URL do PDF)
    const printRes = await meCall("/me/shipment/print", env, token, {
      mode: "private",
      orders: [meOrderId],
    });
    const labelUrl = (printRes as any)?.url ?? null;

    // 5) tracking
    const trackingCode = cartRes.self_tracking ?? cartRes.tracking ?? null;

    await supabase.from("orders").update({
      me_order_id: meOrderId,
      me_label_url: labelUrl,
      me_status: "label_purchased",
      tracking_code: trackingCode,
      status: "shipped",
    }).eq("id", order.id);

    supabase.functions.invoke("send-notification", {
      body: { type: "order_shipped", record_id: order.id },
    }).catch((e) => console.error("shipped email failed:", e));

    return new Response(JSON.stringify({
      ok: true,
      me_order_id: meOrderId,
      label_url: labelUrl,
      tracking_code: trackingCode,
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
