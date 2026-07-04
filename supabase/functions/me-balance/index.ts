// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return ((data?.value as string | null) ?? null)?.trim() ?? null;
}

function meBase(env: string): string {
  return env === "production"
    ? "https://melhorenvio.com.br/api/v2"
    : "https://sandbox.melhorenvio.com.br/api/v2";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const token = await getSetting("me_access_token");
    const env = (await getSetting("me_environment")) ?? "sandbox";
    if (!token) {
      return new Response(JSON.stringify({ balance_cents: 0, unconfigured: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`${meBase(env)}/me/balance`, {
      headers: {
        Authorization: `Bearer ${token.replace(/\s/g, "")}`,
        Accept: "application/json",
        "User-Agent": "Elisa Hoeppers Site Balance Check (willy@magnificodigital.com)",
      },
    });
    if (!res.ok) throw new Error(`ME ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const balance = Number(data.balance ?? 0);
    return new Response(JSON.stringify({ balance_cents: Math.round(balance * 100) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message, balance_cents: null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
