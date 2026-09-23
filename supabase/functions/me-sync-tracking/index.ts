// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sincroniza o rastreio dos pedidos com o Melhor Envio e avisa a cliente em cada etapa.
 * - Chamado por cron (a cada 2h), pelo botão "Atualizar rastreios" do admin e pelo webhook do ME.
 * - Body opcional: { order_id } para sincronizar um pedido só.
 * Transições:  postado → status "shipped" + e-mail "a caminho"
 *              entregue → status "completed" + e-mail "entregue"
 *              não entregue / cancelado → e-mail de alerta (uma vez)
 */

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return ((data?.value as string | null) ?? null)?.trim() || null;
}

function notify(type: string, orderId: string) {
  return supabase.functions
    .invoke("send-notification", { body: { type, record_id: orderId } })
    .catch((e) => console.error(`${type} email failed:`, e));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json().catch(() => ({}));
    const token = await getSetting("me_access_token");
    if (!token) return json({ error: "Token do Melhor Envio não configurado" }, 400);
    const env = (await getSetting("me_environment")) ?? "sandbox";
    const base = env === "production" ? "https://melhorenvio.com.br/api/v2" : "https://sandbox.melhorenvio.com.br/api/v2";

    let q = supabase
      .from("orders")
      .select("id, code, status, me_order_id, me_status, tracking_code")
      .not("me_order_id", "is", null);
    q = body?.order_id ? q.eq("id", body.order_id) : q.in("status", ["confirmed", "shipped"]);
    const { data: orders, error } = await q.limit(100);
    if (error) throw error;
    if (!orders || orders.length === 0) return json({ ok: true, checked: 0, changes: [] });

    const res = await fetch(`${base}/me/shipment/tracking`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "BODYOGA (contato@bodyogaoficial.com.br)",
      },
      body: JSON.stringify({ orders: orders.map((o) => o.me_order_id) }),
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(`ME tracking ${res.status}: ${txt.slice(0, 300)}`);
    const tracking = JSON.parse(txt || "{}") as Record<string, any>;

    const changes: any[] = [];
    for (const o of orders) {
      const t = tracking[o.me_order_id as string];
      if (!t) continue;
      const meStatus: string = String(t.status ?? "").toLowerCase(); // pending|released|posted|delivered|canceled|undelivered
      const code: string | null = t.tracking || t.melhorenvio_tracking || null;
      const update: Record<string, unknown> = {};
      const events: string[] = [];

      if (code && code !== o.tracking_code) update.tracking_code = code;

      if (meStatus === "posted" && o.me_status !== "posted") {
        update.me_status = "posted";
        if (o.status !== "completed") update.status = "shipped";
        events.push("order_in_transit");
      } else if (meStatus === "delivered" && o.status !== "completed") {
        update.me_status = "delivered";
        update.status = "completed";
        events.push("order_completed");
      } else if ((meStatus === "undelivered" || meStatus === "canceled") && o.me_status !== meStatus) {
        update.me_status = meStatus;
        if (meStatus === "undelivered") events.push("order_delivery_issue");
      }

      if (Object.keys(update).length > 0) {
        await supabase.from("orders").update(update).eq("id", o.id);
        for (const ev of events) await notify(ev, o.id);
        changes.push({ code: o.code, me_status: meStatus, tracking: code, emails: events });
      }
    }
    return json({ ok: true, checked: orders.length, changes });
  } catch (err) {
    console.error("me-sync-tracking:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
