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
  return (data?.value as string) ?? null;
}

function mapStatus(mpStatus: string): "pending" | "confirmed" | "cancelled" {
  if (mpStatus === "approved") return "confirmed";
  if (["rejected", "cancelled", "refunded", "charged_back"].includes(mpStatus)) return "cancelled";
  return "pending";
}

serve(async (req) => {
  try {
    const accessToken = await getSetting("mp_access_token");
    if (!accessToken) return new Response(JSON.stringify({ ok: false, error: "mp not configured" }), { status: 200 });

    const body = await req.json().catch(() => ({}));
    console.log("MP webhook:", JSON.stringify(body));

    const type = body.type ?? body.topic;
    const paymentId = body.data?.id ?? body.id;

    if (type !== "payment" || !paymentId) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    if (!paymentRes.ok) {
      console.error("MP payment fetch failed:", paymentRes.status, await paymentRes.text());
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    }
    const payment = await paymentRes.json();
    const externalRef = String(payment.external_reference ?? "");

    if (externalRef.startsWith("enrollment:")) {
      const enrollmentId = externalRef.split(":")[1];
      if (!enrollmentId) return new Response("missing enrollment_id", { status: 400 });

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("*, course:courses(id, slug, title)")
        .eq("id", enrollmentId)
        .maybeSingle();
      if (!enrollment) return new Response("enrollment not found", { status: 404 });

      if (payment.status === "approved" && enrollment.status === "pending_payment") {
        await supabase.from("enrollments").update({ status: "active" }).eq("id", enrollmentId);
        supabase.functions.invoke("send-notification", {
          body: { type: "course_purchased", record_id: enrollmentId },
        }).catch((e) => console.error("course_purchased email failed:", e));
      } else if (payment.status === "rejected" || payment.status === "cancelled") {
        await supabase.from("enrollments").update({ status: "cancelled" }).eq("id", enrollmentId);
      }

      return new Response("OK", { status: 200 });
    }

    const orderId: string | undefined = payment.external_reference;
    if (!orderId) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const newStatus = mapStatus(payment.status);
    const patch: Record<string, unknown> = {
      payment_id: String(payment.id),
      status: newStatus,
    };
    if (newStatus === "confirmed") patch.paid_at = new Date().toISOString();

    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) console.error("supabase update error:", error);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
