// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Recebe os avisos (webhooks) da Awise. URL protegida por ?t=<awise_webhook_token>.
 *  - PRODUCT_STOCK_CHANGED : atualiza o estoque do produto vinculado (se "estoque vem da Awise")
 *  - PRICE_CHANGED         : atualiza o preço (se "preço vem da Awise")
 *  - PRODUCT_CHANGED/CREATED: ressincroniza o produto
 *  - INVOICE_AUTHORIZED    : grava a NF-e no pedido (chave, número, DANFE, XML) e avisa a cliente
 */

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function setting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string) ?? null;
}
const on = (v: string | null) => (v ?? "").toLowerCase() === "true";
const ok = () => new Response("ok", { status: 200 });

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = await setting("awise_webhook_token");
    if (!token || url.searchParams.get("t") !== token) return new Response("forbidden", { status: 403 });
    if (!on(await setting("awise_enabled"))) return ok();

    const payload = await req.json().catch(() => null);
    const events: any[] = Array.isArray(payload) ? payload : [payload];

    for (const ev of events) {
      const type: string = ev?.event ?? ev?.type ?? "";
      const d = ev?.data ?? {};
      console.log("awise-webhook:", type, JSON.stringify(d).slice(0, 300));

      if (type === "PRODUCT_STOCK_CHANGED" && on(await setting("awise_sync_stock"))) {
        const { data: p } = await supabase.from("products").select("id").eq("awise_product_id", d.product).maybeSingle();
        if (p) {
          const qty = Math.floor(parseFloat(d.availableStock ?? "0") || 0);
          const { error } = await supabase.rpc("awise_set_stock", { p_product_id: p.id, p_qty: qty });
          if (error) console.error("awise_set_stock:", error.message);
        }
      } else if (type === "PRICE_CHANGED" && on(await setting("awise_sync_price"))) {
        const cents = Math.round(parseFloat(d.price ?? "0") * 100);
        if (cents > 0) await supabase.from("products").update({ price_cents: cents }).eq("awise_product_id", d.id);
      } else if (type === "PRODUCT_CHANGED" || type === "PRODUCT_CREATED") {
        if (d.id) {
          await supabase.functions
            .invoke("awise", { body: { action: "sync_products", awise_ids: [d.id] } })
            .catch((e) => console.error("resync:", e));
        }
      } else if (type === "INVOICE_AUTHORIZED") {
        const { data: order } = await supabase
          .from("orders").select("id, base_invoice_status").eq("awise_order_id", d.generatorId).maybeSingle();
        if (!order) continue;
        let key: string | null = null;
        if (d.xmlLink) {
          try {
            const xml = await (await fetch(d.xmlLink)).text();
            key = xml.match(/<chNFe>(\d{44})<\/chNFe>/)?.[1] ?? xml.match(/Id="NFe(\d{44})"/)?.[1] ?? null;
          } catch (e) {
            console.error("xml da nota:", e);
          }
        }
        await supabase.from("orders").update({
          base_invoice_status: "AUTORIZADA",
          base_invoice_number: d.invoiceNumber ?? null,
          base_invoice_key: key,
          base_invoice_danfe_url: d.pdfLink ?? null,
          base_invoice_xml_url: d.xmlLink ?? null,
          base_invoice_error: null,
          base_invoice_emitted_at: d.timestamp ?? new Date().toISOString(),
        }).eq("id", order.id);
        if (order.base_invoice_status !== "AUTORIZADA") {
          await supabase.functions
            .invoke("send-notification", { body: { type: "invoice_ready", record_id: order.id } })
            .catch((e) => console.error("invoice email:", e));
        }
      }
    }
    return ok();
  } catch (e) {
    console.error("awise-webhook error:", e);
    return ok(); // não faz a Awise reenviar em loop por erro nosso
  }
});
