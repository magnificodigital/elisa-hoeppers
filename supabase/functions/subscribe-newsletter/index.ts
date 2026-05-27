// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

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
    const { email, full_name, source } = await req.json();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return new Response(JSON.stringify({ error: "email inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = (full_name ?? "").trim() || null;

    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, resend_contact_id, unsubscribed_at")
      .eq("email", cleanEmail)
      .maybeSingle();

    let row: { id: string; resend_contact_id?: string | null };
    if (existing) {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .update({
          unsubscribed_at: null,
          full_name: cleanName ?? undefined,
          source: source ?? undefined,
        })
        .eq("id", existing.id)
        .select("id, resend_contact_id")
        .single();
      if (error) throw error;
      row = data;
    } else {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: cleanEmail, full_name: cleanName, source })
        .select("id, resend_contact_id")
        .single();
      if (error) throw error;
      row = data;
    }

    const audienceId = await getSetting("resend_audience_id");
    if (audienceId && RESEND_API_KEY) {
      try {
        const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            first_name: cleanName?.split(" ")[0],
            last_name: cleanName?.split(" ").slice(1).join(" ") || undefined,
            unsubscribed: false,
          }),
        });
        if (res.ok) {
          const contact = await res.json();
          await supabase.from("newsletter_subscribers")
            .update({ resend_contact_id: contact.id })
            .eq("id", row.id);
        } else {
          console.warn("Resend audience sync failed:", res.status, await res.text());
        }
      } catch (e) {
        console.warn("Resend audience sync error:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
