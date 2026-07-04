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
      console.error("MP webhook: assinatura inválida");
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const accessToken = await getSetting("mp_access_token");
    if (!accessToken) {
      return new Response(JSON.stringify({ ok: false, error: "mp not configured" }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    const body = JSON.parse(rawBody || "{}");
    console.log("MP webhook:", JSON.stringify(body));

    const type = body.type ?? body.topic;
    const paymentId = body.data?.id ?? body.id;

    if (type !== "payment" || !paymentId) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    if (!paymentRes.ok) {
      console.error("MP payment fetch failed:", paymentRes.status, await paymentRes.text());
      return new Response(JSON.stringify({ ok: false }), { status: 200, headers: jsonHeaders });
    }
    const payment = await paymentRes.json();
    const externalRef = String(payment.external_reference ?? "");

    // Idempotência: grava payment_id como processado. Se já existir, é retry → ignora.
    const { error: dedupErr } = await supabase
      .from("processed_mp_payments")
      .insert({
        payment_id: String(payment.id),
        status: payment.status,
        raw: payment,
      });
    if (dedupErr) {
      if (dedupErr.code === "23505") {
        console.log(`MP webhook: payment ${payment.id} já processado, ignorando retry`);
        return new Response(JSON.stringify({ ok: true, already_processed: true }), {
          status: 200,
          headers: jsonHeaders,
        });
      }
      // Outro erro (falha de DB) — não bloqueia processamento por causa da tabela de dedup
      console.error("MP webhook dedup insert failed:", dedupErr);
    }


    if (externalRef.startsWith("enrollment:")) {
      const enrollmentId = externalRef.split(":")[1];
      if (!enrollmentId) {
        return new Response(JSON.stringify({ error: "missing enrollment_id" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("*, course:courses(id, slug, title)")
        .eq("id", enrollmentId)
        .maybeSingle();
      if (!enrollment) {
        return new Response(JSON.stringify({ error: "enrollment not found" }), {
          status: 404,
          headers: jsonHeaders,
        });
      }

      if (payment.status === "approved" && enrollment.status === "pending_payment") {
        await supabase.from("enrollments").update({ status: "active" }).eq("id", enrollmentId);
        supabase.functions.invoke("send-notification", {
          body: { type: "course_purchased", record_id: enrollmentId },
        }).catch((e) => console.error("course_purchased email failed:", e));
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        await supabase.from("enrollments").update({ status: "cancelled" }).eq("id", enrollmentId);
      }

      await supabase
        .from("processed_mp_payments")
        .update({ enrollment_id: enrollmentId })
        .eq("payment_id", String(payment.id));

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
    }


    const orderId: string | undefined = payment.external_reference;
    if (!orderId) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });

    const newStatus = mapStatus(payment.status);
    const patch: Record<string, unknown> = {
      payment_id: String(payment.id),
      status: newStatus,
    };
    if (newStatus === "confirmed") patch.paid_at = new Date().toISOString();

    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) console.error("supabase update error:", error);

    await supabase
      .from("processed_mp_payments")
      .update({ order_id: orderId })
      .eq("payment_id", String(payment.id));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
