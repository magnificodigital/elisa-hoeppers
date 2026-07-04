// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// CORS aberto apenas para a resposta de OPTIONS (webhooks não são chamados pelo browser)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string) ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    // valida secret na query string
    const url = new URL(req.url);
    const providedSecret = url.searchParams.get("secret") ?? "";
    const expectedSecret = await getSetting("me_webhook_secret");

    if (expectedSecret && providedSecret !== expectedSecret) {
      console.error("ME webhook: secret inválido");
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }
    if (!expectedSecret) console.warn("ME webhook secret not configured — allowing (INSECURE)");

    const payload = await req.json();
    console.log("ME webhook received:", JSON.stringify(payload).slice(0, 500));

    const event = payload.event ?? payload.type;
    const meOrderId = payload.order_id ?? payload.data?.id;

    if (meOrderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("me_order_id", meOrderId)
        .maybeSingle();

      if (order) {
        const update: any = { me_status: event };
        if (event === "delivered") update.status = "completed";
        await supabase.from("orders").update(update).eq("id", order.id);

        if (event === "delivered") {
          supabase.functions.invoke("send-notification", {
            body: { type: "order_completed", record_id: order.id },
          }).catch((e) => console.error("delivered email failed:", e));
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error(err);
    // retorna 200 mesmo em erro pra ME não re-tentar infinito
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 200,
      headers: jsonHeaders,
    });
  }
});
