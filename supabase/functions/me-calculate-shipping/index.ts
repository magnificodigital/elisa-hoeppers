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
  return (data?.value as string) ?? null;
}

function meBase(env: string): string {
  return env === "production"
    ? "https://melhorenvio.com.br/api/v2"
    : "https://sandbox.melhorenvio.com.br/api/v2";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const enabled = await getSetting("me_enabled");
    if (enabled !== "true") {
      return new Response(JSON.stringify({ options: [], disabled: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = await getSetting("me_access_token");
    const env = (await getSetting("me_environment")) ?? "sandbox";
    const cepOrigem = await getSetting("me_origin_cep");
    if (!token || !cepOrigem) throw new Error("ME não configurado (token ou CEP origem ausente)");

    const { cep_destino, items } = await req.json();
    if (!cep_destino || !Array.isArray(items) || items.length === 0) {
      throw new Error("cep_destino e items obrigatórios");
    }

    const cleanCepOrigem = cepOrigem.replace(/\D/g, "");
    const cleanCepDestino = String(cep_destino).replace(/\D/g, "");
    if (cleanCepDestino.length !== 8) throw new Error("CEP destino inválido");

    const ids = items.map((i: any) => i.product_id);
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price_cents, weight_g, length_cm, width_cm, height_cm")
      .in("id", ids);
    if (prodErr) throw prodErr;

    const defWeight = parseInt((await getSetting("me_default_weight_g")) ?? "300");
    const defLength = parseFloat((await getSetting("me_default_length_cm")) ?? "20");
    const defWidth = parseFloat((await getSetting("me_default_width_cm")) ?? "15");
    const defHeight = parseFloat((await getSetting("me_default_height_cm")) ?? "10");

    const meProducts = items.map((it: any) => {
      const p = (products ?? []).find((pp: any) => pp.id === it.product_id);
      if (!p) throw new Error(`Produto ${it.product_id} não encontrado`);
      return {
        id: p.id,
        width: p.width_cm ?? defWidth,
        height: p.height_cm ?? defHeight,
        length: p.length_cm ?? defLength,
        weight: (p.weight_g ?? defWeight) / 1000, // ME usa kg
        insurance_value: (p.price_cents / 100) * it.qty,
        quantity: it.qty,
      };
    });

    // Apenas as transportadoras permitidas (IDs configurados no admin). Vazio = todas.
    const servicesRaw = (await getSetting("me_allowed_services")) ?? "";
    const allowedServices = servicesRaw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s));
    const allowedSet = new Set(allowedServices);

    const payload: Record<string, unknown> = {
      from: { postal_code: cleanCepOrigem },
      to: { postal_code: cleanCepDestino },
      products: meProducts,
    };
    if (allowedServices.length > 0) {
      payload.services = allowedServices.join(",");
    }

    const res = await fetch(`${meBase(env)}/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Elisa Hoeppers Site (willy@magnificodigital.com)",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("ME calculate error", res.status, txt);
      throw new Error(`ME ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data = await res.json();

    const options = (data as any[])
      .filter((o: any) => !o.error && o.price)
      .filter((o: any) => allowedSet.size === 0 || allowedSet.has(String(o.id)))
      .map((o: any) => ({
        id: String(o.id),
        name: o.name,
        company: o.company?.name ?? "—",
        price_cents: Math.round(parseFloat(o.price) * 100),
        delivery_days: parseInt(o.delivery_time ?? "0"),
        error: o.error ?? null,
      }))
      .sort((a, b) => a.price_cents - b.price_cents);

    return new Response(JSON.stringify({ options }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message, options: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
