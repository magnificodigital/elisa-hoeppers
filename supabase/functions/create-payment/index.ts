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
  return (data?.value as string) ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // @ts-ignore - Deno: prioriza o secret (mais seguro); fallback pro valor no banco durante a transição
    const accessToken = Deno.env.get("MP_ACCESS_TOKEN") ?? await getSetting("mp_access_token");
    if (!accessToken) throw new Error("Mercado Pago não configurado. Vá em /admin/configuracoes e adicione o Access Token.");

    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id required");

    const { data: order, error } = await supabase.from("orders").select("*").eq("id", order_id).maybeSingle();
    if (error || !order) throw new Error("order not found");
    if (order.status !== "pending") throw new Error("order not pending");

    const mpItems = order.items.map((it: any) => ({
      id: it.product_id,
      title: it.name,
      quantity: it.qty,
      unit_price: it.unit_price_cents / 100,
      currency_id: "BRL",
    }));

    if (order.shipping_cents && order.shipping_cents > 0) {
      mpItems.push({
        id: "shipping",
        title: `Frete · ${order.shipping_service_label ?? "Envio"}`,
        quantity: 1,
        unit_price: order.shipping_cents / 100,
        currency_id: "BRL",
      });
    }


    const preferencePayload = {
      items: mpItems,
      payer: { name: order.customer_name, email: order.customer_email },
      back_urls: {
        success: `${SITE_URL}/pedido/${order.code}?status=success`,
        pending: `${SITE_URL}/pedido/${order.code}?status=pending`,
        failure: `${SITE_URL}/pedido/${order.code}?status=failure`,
      },
      auto_return: "approved",
      external_reference: order.id,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      statement_descriptor: "ELISA HOEPPERS",
      metadata: { order_code: order.code },
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(preferencePayload),
    });
    if (!mpRes.ok) {
      const errTxt = await mpRes.text();
      console.error("MP error", mpRes.status, errTxt);
      throw new Error(`MP ${mpRes.status}: ${errTxt}`);
    }
    const preference = await mpRes.json();

    await supabase.from("orders").update({
      payment_method: "mercadopago",
      payment_preference_id: preference.id,
    }).eq("id", order.id);

    return new Response(JSON.stringify({ init_point: preference.init_point, preference_id: preference.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
