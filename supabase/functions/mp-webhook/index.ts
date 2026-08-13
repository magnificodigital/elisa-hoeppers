// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS aberto apenas para a resposta de OPTIONS (webhooks não são chamados pelo browser)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-signature, x-request-id, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string) ?? null;
}

function mapStatus(mpStatus: string): "pending" | "confirmed" | "cancelled" {
  if (mpStatus === "approved") return "confirmed";
  if (["rejected", "cancelled", "refunded", "charged_back"].includes(mpStatus)) return "cancelled";
  return "pending";
}

async function verifyMpSignature(req: Request, body: string): Promise<boolean> {
  const secret = await getSetting("mp_webhook_secret");
  if (!secret) {
    console.warn("MP webhook secret not configured — allowing (INSECURE)");
    return true; // não bloqueia enquanto não estiver configurado, mas loga
  }

  const sigHeader = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  if (!sigHeader || !requestId) return false;

  // parse: "ts=1234,v1=abc..."
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.trim().split("=")),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // extract data.id do body
  let dataId = "";
  try {
    const parsed = JSON.parse(body);
    dataId = String(parsed?.data?.id ?? parsed?.id ?? "");
  } catch {
    return false;
  }

  // template: id:<dataId>;request-id:<requestId>;ts:<ts>;
  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(template));
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hex === v1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    const rawBody = await req.text();

    const valid = await verifyMpSignature(req, rawBody);
    if (!valid) {
      console.warn("MP webhook: assinatura não confere, mas continuando pois o pagamento será validado via API do MP");
    }

    // Busca o Access Token da tabela payment_secrets (com fallback pro env/settings)
    let accessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!accessToken) {
      const { data: secretRow } = await supabase
        .from("payment_secrets")
        .select("secret_value")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      accessToken = secretRow?.secret_value;
    }
    if (!accessToken) accessToken = await getSetting("mp_access_token");

    if (!accessToken) {
      console.error("mp-webhook: Access Token não configurado");
      return new Response("ok", { status: 200 }); // retorna ok pro MP parar de tentar
    }

    const body = JSON.parse(rawBody || "{}");
    const type = body.type ?? body.topic;
    const paymentId = String(body.data?.id ?? body.id ?? "");

    if (type !== "payment" || !paymentId) {
      return new Response("ok", { status: 200 });
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    if (!paymentRes.ok) {
      console.error("MP payment fetch failed:", paymentRes.status, await paymentRes.text());
      return new Response(JSON.stringify({ ok: false }), { status: 200, headers: jsonHeaders });
    }
    const payment = await paymentRes.json();
    const ref = payment.external_reference; // ex: "6LXREW" (é o CODE, não o UUID)

    // Busca o pedido pelo ID do pagamento ou pelo código (external_reference)
    let { data: order } = await supabase.from("orders")
      .select("id, code, status")
      .eq("mp_payment_id", paymentId).maybeSingle();
    
    if (!order && ref) {
      const { data: orderFromRef } = await supabase.from("orders")
        .select("id, code, status")
        .eq("code", ref)
        .maybeSingle();
      order = orderFromRef;
    }

    if (!order) {
      console.log("mp-webhook: pedido não encontrado", paymentId, ref);
      return new Response("ok", { status: 200 });
    }

    // Idempotência correta: só pula se JÁ estiver confirmado
    if (order.status === "confirmed") {
      console.log("mp-webhook: pedido já confirmado, ignorando", order.code);
      return new Response("ok", { status: 200 });
    }

    if (payment.status === "approved") {
      const { error: updateError } = await supabase.from("orders").update({
        status: "confirmed",
        mp_payment_id: paymentId,
        mp_payment_status: payment.status,
        mp_payment_method: payment.payment_method_id,
        paid_at: new Date().toISOString(),
      }).eq("id", order.id);   // <-- atualiza pelo UUID correto

      if (updateError) {
        console.error("mp-webhook: erro ao atualizar pedido", updateError);
        return new Response("error", { status: 500 });
      }

      // Dispara notificações e integrações
      supabase.functions.invoke("send-notification", {
        body: { type: "order", record_id: order.id },
      }).catch((e) => console.error("email dispatch failed:", e));

      const baseEnabled = await getSetting("base_enabled");
      if (baseEnabled === "true") {
        supabase.functions.invoke("base-emit-invoice", {
          body: { order_id: order.id },
        }).catch((e) => console.error("NFe emit falhou:", e));
      }
    } else if (["rejected", "cancelled", "refunded"].includes(payment.status)) {
       await supabase.from("orders").update({
        status: "cancelled",
        mp_payment_id: paymentId,
        mp_payment_status: payment.status,
      }).eq("id", order.id);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
