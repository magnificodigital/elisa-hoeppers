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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

serve(async (req) => {
  try {
    const expectedToken = await getSetting("base_webhook_token");
    const providedToken = req.headers.get("access_token") ?? req.headers.get("x-webhook-token") ?? "";

    if (expectedToken) {
      if (!providedToken || !timingSafeEqual(providedToken, expectedToken)) {
        console.error("Base webhook: token inválido (from IP:", req.headers.get("x-forwarded-for"), ")");
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("Base webhook: expected token não configurado — modo permissivo (INSEGURO)");
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
    }

    const event = body.event;
    const nfe = body.invoiceNfe ?? body.data ?? {};
    const invoiceId = nfe.id ?? nfe.invoiceId;

    if (!invoiceId || typeof invoiceId !== "number") {
      console.warn("Base webhook: invoiceId ausente ou inválido");
      return new Response(JSON.stringify({ ok: true, ignored: "no invoice id" }), { status: 200 });
    }

    if (!event || typeof event !== "string") {
      console.warn("Base webhook: event ausente ou inválido");
      return new Response(JSON.stringify({ ok: true, ignored: "no event" }), { status: 200 });
    }

    const { data: order } = await supabase.from("orders")
      .select("id, code, customer_email, status, base_invoice_status, base_invoice_emitted_at")
      .eq("base_invoice_id", invoiceId).maybeSingle();

    if (!order) {
      console.warn(`Base webhook: pedido não encontrado pra invoice ${invoiceId} — payload ignorado`);
      return new Response(JSON.stringify({ ok: true, ignored: "order not found" }), { status: 200 });
    }

    if (event === "INVOICE_NFE_AUTHORIZED" && order.base_invoice_status === "AUTORIZADA" && order.base_invoice_emitted_at) {
      console.log(`Base webhook: invoice ${invoiceId} já processada como AUTORIZADA, ignorando replay`);
      return new Response(JSON.stringify({ ok: true, already_processed: true }), { status: 200 });
    }

    console.log(`Base webhook: event=${event} invoice=${invoiceId} order=${order.code}`);

    let statusUpdate: any = {};
    let dispatchEmail = false;

    if (event === "INVOICE_NFE_AUTHORIZED") {
      statusUpdate = {
        base_invoice_status: "AUTORIZADA",
        base_invoice_key: nfe.accessKey ?? nfe.key ?? null,
        base_invoice_danfe_url: nfe.danfeUrl ?? nfe.pdfUrl ?? null,
        base_invoice_xml_url: nfe.xmlUrl ?? null,
        base_invoice_number: nfe.number ?? null,
        base_invoice_error: null,
        base_invoice_emitted_at: new Date().toISOString(),
      };
      dispatchEmail = true;
    } else if (event === "INVOICE_NFE_ERROR") {
      statusUpdate = {
        base_invoice_status: "ERRO",
        base_invoice_error: nfe.error ?? nfe.message ?? "Erro na emissão",
      };
    } else if (event === "INVOICE_NFE_CANCELED") {
      statusUpdate = { base_invoice_status: "CANCELADA" };
    } else if (event === "INVOICE_NFE_CREATED") {
      statusUpdate = { base_invoice_status: "CRIADA" };
    } else {
      statusUpdate = { base_invoice_status: event ?? "DESCONHECIDO" };
    }

    await supabase.from("orders").update(statusUpdate).eq("id", order.id);

    if (dispatchEmail && statusUpdate.base_invoice_danfe_url) {
      supabase.functions.invoke("send-notification", {
        body: { type: "invoice_ready", record_id: order.id },
      }).catch((e) => console.error("Email NFe falhou:", e));
    }

    return new Response(JSON.stringify({ ok: true, event, status: statusUpdate.base_invoice_status }), { status: 200 });
  } catch (err) {
    console.error("Base webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 200 });
  }
});
