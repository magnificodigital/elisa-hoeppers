// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Rede de segurança do pagamento: roda a cada 10 min (cron).
 * Para cada pedido pendente pago via link da Pagar.me (últimas 72h), consulta o link;
 * se ele já foi pago, localiza o pedido da Pagar.me e aplica a mesma lógica do webhook.
 * Assim nenhum pagamento fica sem confirmar, mesmo se o webhook falhar ou não estiver configurado.
 */

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const KEY = (Deno.env.get("PAGARME_SECRET_KEY") ?? "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const B = "https://api.pagar.me/core/v5";
const H = { Authorization: "Basic " + btoa(`${KEY}:`) };

async function pg(path: string) {
  const r = await fetch(`${B}${path}`, { headers: H });
  return r.ok ? await r.json() : null;
}

serve(async () => {
  try {
    if (!KEY) return new Response(JSON.stringify({ error: "sem PAGARME_SECRET_KEY" }), { status: 400 });
    const since = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
    const { data: pending } = await supabase
      .from("orders")
      .select("id, code, payment_preference_id")
      .eq("status", "pending")
      .eq("payment_method", "pagarme")
      .like("payment_preference_id", "pl_%")
      .gte("created_at", since)
      .limit(50);

    const applied: string[] = [];
    for (const o of pending ?? []) {
      const link = await pg(`/paymentlinks/${o.payment_preference_id}`);
      if (!link || !(Number(link.total_paid_sessions) > 0)) continue;

      // Pedido da Pagar.me gerado pelo link tem code = id do link.
      const list = await pg(`/orders?code=${encodeURIComponent(o.payment_preference_id as string)}&size=5`);
      let pgOrders: any[] = list?.data ?? [];
      if (pgOrders.length === 0) {
        const recent = await pg(`/orders?size=50`);
        pgOrders = (recent?.data ?? []).filter(
          (x: any) => x.code === o.payment_preference_id || x.metadata?.order_code === o.code,
        );
      }
      for (const p of pgOrders) {
        // Reaproveita o webhook (ele re-consulta, concilia, confirma e dispara e-mails/NF-e).
        await supabase.functions
          .invoke("pagarme-webhook", { body: { type: "sync", data: { id: p.id } } })
          .catch((e) => console.error("sync->webhook failed:", e));
        applied.push(`${o.code}:${p.id}:${p.status}`);
      }
    }
    return new Response(JSON.stringify({ ok: true, checked: pending?.length ?? 0, applied }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pagarme-sync:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
