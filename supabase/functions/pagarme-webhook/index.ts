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
const auth = () => "Basic " + btoa(`${PAGARME_SECRET_KEY}:`);

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return ((data?.value as string | null) ?? null)?.trim() || null;
}

type OurOrder = { id: string; code: string; status: string };

/**
 * Acha o NOSSO pedido a partir do pedido da Pagar.me.
 * Pedidos criados por Link de Pagamento recebem code = "pl_..." (id do link),
 * então tentamos, nessa ordem: metadata.order_code → id do link salvo em
 * orders.payment_preference_id → code igual ao nosso.
 */
async function findOurOrder(pg: any): Promise<OurOrder | null> {
  const sel = "id, code, status";
  const metaCode = pg?.metadata?.order_code;
  if (metaCode) {
    const { data } = await supabase.from("orders").select(sel).eq("code", metaCode).maybeSingle();
    if (data) return data as OurOrder;
  }
  const linkIds = [pg?.code, pg?.metadata?.payment_link_id, pg?.checkouts?.[0]?.payment_link_id]
    .filter((v) => typeof v === "string" && v.startsWith("pl_"));
  for (const linkId of linkIds) {
    const { data } = await supabase.from("orders").select(sel).eq("payment_preference_id", linkId).maybeSingle();
    if (data) return data as OurOrder;
  }
  if (pg?.code) {
    const { data } = await supabase.from("orders").select(sel).eq("code", pg.code).maybeSingle();
    if (data) return data as OurOrder;
  }
  return null;
}

serve(async (req) => {
  // A Pagar.me só para de reenviar com 2xx.
  try {
    if (req.method !== "POST") return new Response("ok", { status: 200 });
    const body = await req.json().catch(() => null);
    const type: string = body?.type ?? "";
    const data = body?.data ?? {};
    console.log("pagarme-webhook:", type, data?.id);

    const pgOrderId: string | undefined =
      typeof data?.id === "string" && data.id.startsWith("or_") ? data.id : data?.order?.id ?? data?.order_id;
    if (!pgOrderId) return new Response("ok", { status: 200 });

    // Fonte da verdade: re-consulta o pedido na Pagar.me (evita webhook forjado).
    const res = await fetch(`${PAGARME_BASE}/orders/${pgOrderId}`, { headers: { Authorization: auth() } });
    if (!res.ok) {
      console.error("pagarme-webhook: falha ao consultar order", res.status, await res.text());
      return new Response("ok", { status: 200 });
    }
    const pg = await res.json();
    const ours = await findOurOrder(pg);
    if (!ours) {
      console.warn("pagarme-webhook: pedido não conciliado", pgOrderId, pg?.code, JSON.stringify(pg?.metadata));
      return new Response("ok", { status: 200 });
    }

    const charge = Array.isArray(pg?.charges) ? pg.charges[0] : null;
    const method: string | null = charge?.payment_method ?? null; // "pix" | "credit_card" | ...
    const installments = charge?.last_transaction?.installments ?? null;

    if (pg.status === "paid") {
      if (["confirmed", "shipped", "completed"].includes(ours.status)) {
        return new Response("ok", { status: 200 }); // já processado
      }
      const { error: upErr } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          paid_at: new Date().toISOString(),
          payment_method: "pagarme",
          payment_id: pg.id,
          payment_method_type: method,
          payment_installments: installments,
        })
        .eq("id", ours.id)
        .in("status", ["pending", "cancelled"]); // só avança se ainda não foi pago
      if (upErr) {
        console.error("pagarme-webhook: erro ao confirmar", upErr);
        return new Response("error", { status: 500 }); // deixa a Pagar.me reenviar
      }

      await supabase.functions
        .invoke("send-notification", { body: { type: "order_paid", record_id: ours.id } })
        .catch((e) => console.error("paid email failed:", e));

      if ((await getSetting("base_enabled")) === "true" && (await getSetting("base_auto_emit")) !== "false") {
        await supabase.functions
          .invoke("base-emit-invoice", { body: { order_id: ours.id } })
          .catch((e) => console.error("NFe auto falhou:", e));
      }
    } else if (["canceled", "failed"].includes(pg.status) && ours.status === "pending") {
      await supabase.from("orders").update({ status: "cancelled", payment_id: pg.id }).eq("id", ours.id);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("pagarme-webhook error:", err);
    return new Response("ok", { status: 200 });
  }
});
