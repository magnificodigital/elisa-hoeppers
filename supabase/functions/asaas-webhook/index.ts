// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string | null)?.trim() ?? null;
}

serve(async (req) => {
  try {
    const expectedToken = await getSetting("asaas_webhook_token");
    const providedToken = req.headers.get("asaas-access-token") ?? "";
    if (!expectedToken) {
      console.warn("asaas_webhook_token não configurado, aceitando (INSECURE)");
    } else if (providedToken !== expectedToken) {
      console.error("Asaas webhook: token inválido");
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const event = body.event as string | undefined;
    const payment = body.payment;
    const paymentId = payment?.id as string | undefined;
    const externalRef = payment?.externalReference as string | undefined;
    const status = payment?.status as string | undefined;

    if (!paymentId) {
      return new Response(JSON.stringify({ ok: true, ignored: "no payment" }), { status: 200 });
    }

    let orderQuery = supabase.from("orders").select("id, status").eq("asaas_payment_id", paymentId).maybeSingle();
    let { data: order } = await orderQuery;
    if (!order && externalRef) {
      const res = await supabase.from("orders").select("id, status").eq("id", externalRef).maybeSingle();
      order = res.data ?? null;
    }

    if (!order) {
      console.warn(`Order não encontrada pra payment ${paymentId} externalRef ${externalRef}`);
      return new Response(JSON.stringify({ ok: true, ignored: "order not found" }), { status: 200 });
    }

    let newStatus: string | null = null;
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      newStatus = "confirmed";
    } else if (event === "PAYMENT_OVERDUE" || event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
      newStatus = "cancelled";
    }

    const update: Record<string, unknown> = { asaas_payment_status: status };
    if (newStatus) update.status = newStatus;

    await supabase.from("orders").update(update).eq("id", order.id);

    if (newStatus === "confirmed" && order.status !== "confirmed") {
      supabase.functions.invoke("send-notification", {
        body: { type: "order", record_id: order.id },
      }).catch((e) => console.error("email dispatch failed:", e));
    }

    return new Response(JSON.stringify({ ok: true, event, newStatus }), { status: 200 });
  } catch (err) {
    console.error("Asaas webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 200 });
  }
});
