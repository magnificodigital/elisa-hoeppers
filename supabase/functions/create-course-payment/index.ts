// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://hoepppers.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string) ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const enabled = await getSetting("mp_enabled");
    if (enabled !== "true") throw new Error("Mercado Pago não está habilitado.");

    const accessToken = await getSetting("mp_access_token");
    if (!accessToken) throw new Error("Mercado Pago não configurado.");

    // pega user do auth header
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Você precisa estar logada pra comprar.");
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? "";

    const { course_id } = await req.json();
    if (!course_id) throw new Error("course_id obrigatório");

    // busca curso + valida preço
    const { data: course, error: cErr } = await supabase
      .from("courses")
      .select("id, slug, title, price_cents")
      .eq("id", course_id)
      .eq("is_published", true)
      .maybeSingle();
    if (cErr || !course) throw new Error("Curso não encontrado");
    if (!course.price_cents || course.price_cents <= 0) throw new Error("Curso gratuito não precisa de pagamento.");

    // verifica se já tem matrícula ativa
    const { data: existingActive } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", userId)
      .eq("course_id", course_id)
      .eq("status", "active")
      .maybeSingle();
    if (existingActive) throw new Error("Você já está matriculada neste curso.");

    // se já tem matrícula pending_payment com preference, retorna a mesma (idempotente)
    const { data: existingPending } = await supabase
      .from("enrollments")
      .select("id, payment_preference_id")
      .eq("user_id", userId)
      .eq("course_id", course_id)
      .eq("status", "pending_payment")
      .maybeSingle();

    let enrollmentId = existingPending?.id;
    if (!enrollmentId) {
      const { data: newEnroll, error: eErr } = await supabase
        .from("enrollments")
        .insert({
          user_id: userId,
          course_id: course_id,
          status: "pending_payment",
          paid_cents: course.price_cents,
        })
        .select("id")
        .single();
      if (eErr) throw eErr;
      enrollmentId = newEnroll.id;
    }

    // cria preference MP
    const preferencePayload = {
      items: [{
        id: course.id,
        title: `Curso: ${course.title}`,
        quantity: 1,
        unit_price: course.price_cents / 100,
        currency_id: "BRL",
      }],
      payer: { email: userEmail },
      back_urls: {
        success: `${SITE_URL}/cursos/${course.slug}?status=success`,
        pending: `${SITE_URL}/cursos/${course.slug}?status=pending`,
        failure: `${SITE_URL}/cursos/${course.slug}?status=failure`,
      },
      auto_return: "approved",
      external_reference: `enrollment:${enrollmentId}`,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      statement_descriptor: "ELISA HOEPPERS",
      metadata: { type: "course", enrollment_id: enrollmentId, course_id: course.id },
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(preferencePayload),
    });
    if (!mpRes.ok) {
      const errTxt = await mpRes.text();
      throw new Error(`MP ${mpRes.status}: ${errTxt}`);
    }
    const preference = await mpRes.json();

    await supabase.from("enrollments").update({
      payment_preference_id: preference.id,
    }).eq("id", enrollmentId);

    return new Response(JSON.stringify({ init_point: preference.init_point, preference_id: preference.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
