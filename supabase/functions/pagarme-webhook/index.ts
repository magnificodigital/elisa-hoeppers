// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const PAGARME_SECRET_KEY = (Deno.env.get("PAGARME_SECRET_KEY") ?? "").trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PAGARME_BASE = "https://api.pagar.me/core/v5";

function authHeader(): string {
  return "Basic " + btoa(`${PAGARME_SECRET_KEY}:`);
}

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return ((data?.value as string | null) ?? null)?.trim() || null;
}

serve(async (req) => {
  // Pagar.me sempre espera 2xx; senão fica reenviando.
  try {
    if (req.method !== "POST") return new Response("ok", { status: 200 });

    const body = await req.json().catch(() => null);
    const type: string = body?.type ?? "";
    const data = body?.data ?? {};

    // id do pedido Pagar.me (data é order em order.*; é charge em charge.*)
    const pagarmeOrderId: string | undefined =
      data?.id?.startsWith?.("or_") ? data.id : data?.order_id;
    // referência do nosso pedido
    const ourCode: string | undefined = data?.code ?? data?.metadata?.order_code;

    if (!pagarmeOrderId && !ourCode) {
      console.log("pagarme-webhook: sem id/code, ignorando", type);
      return new Response("ok", { status: 200 });
    }

    // Re-consulta o pedido na Pagar.me (autoritativo) — evita confirmação falsa
    let paidConfirmed = false;
    let canceled = false;
    let resolvedCode = ourCode;
    if (pagarmeOrderId && PAGARME_SECRET_KEY) {
      const res = await fetch(`${PAGARME_BASE}/orders/${pagarmeOrderId}`, {
        headers: { Authorization: authHeader() },
      });
      if (res.ok) {
        const order = await res.json();
        resolvedCode = order?.code ?? order?.metadata?.order_code ?? ourCode;
        const status = order?.status;
        paidConfirmed = status === "paid";
        canceled = status === "canceled" || status === "failed";
      } else {
        console.error("pagarme-webhook: falha ao consultar order", res.status, await res.text());
      }
    } else {
      // Sem id pra reconsultar: confia no tipo do evento (fallback)
      paidConfirmed = type === "order.paid" || type === "charge.paid";
      canceled = type === "order.canceled" || type === "order.payment_failed" || type === "charge.payment_failed";
    }

    if (!resolvedCode) {
      return new Response("ok", { status: 200 });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, code, status")
      .eq("code", resolvedCode)
      .maybeSingle();

    if (!order) {
      console.log("pagarme-webhook: pedido não encontrado", resolvedCode);
      return new Response("ok", { status: 200 });
    }

    if (order.status === "confirmed" || order.status === "shipped" || order.status === "completed") {
      return new Response("ok", { status: 200 }); // já pago
    }

    if (paidConfirmed && order.status === "pending") {
      const { error: upErr } = await supabase
        .from("orders")
        .update({ status: "confirmed", paid_at: new Date().toISOString() })
        .eq("id", order.id);
      if (upErr) {
        console.error("pagarme-webhook: erro ao confirmar", upErr);
        return new Response("error", { status: 500 });
      }

      supabase.functions
        .invoke("send-notification", { body: { type: "order", record_id: order.id } })
        .catch((e) => console.error("email dispatch failed:", e));

      const baseEnabled = await getSetting("base_enabled");
      if (baseEnabled === "true") {
        supabase.functions
          .invoke("base-emit-invoice", { body: { order_id: order.id } })
          .catch((e) => console.error("NFe emit falhou:", e));
      }
    } else if (canceled && order.status === "pending") {
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("pagarme-webhook error:", err);
    // Retorna 200 pra não gerar reenvios infinitos por erro transitório
    return new Response("ok", { status: 200 });
  }
});
