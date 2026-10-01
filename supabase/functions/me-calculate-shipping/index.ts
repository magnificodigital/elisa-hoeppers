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

const pos = (v: unknown): number | null => (typeof v === "number" && v > 0 ? v : null);

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

    const body = await req.json();
    const cep_destino = body?.cep_destino;
    if (!cep_destino || !Array.isArray(body?.items) || body.items.length === 0 || body.items.length > 50) {
      throw new Error("cep_destino e items obrigatórios");
    }
    // Agrupa por produto e valida quantidades (inteiro de 1 a 100).
    const qtyById = new Map<string, number>();
    for (const it of body.items) {
      const q = Number(it?.qty);
      if (!it?.product_id || !Number.isInteger(q) || q < 1 || q > 100) throw new Error("item inválido");
      qtyById.set(String(it.product_id), (qtyById.get(String(it.product_id)) ?? 0) + q);
    }
    const items = [...qtyById.entries()].map(([product_id, qty]) => ({ product_id, qty }));

    // Anti-abuso: no máximo ~300 cotações a cada 10 minutos (uso real é muito menor).
    const { count: recent } = await supabase
      .from("shipping_quotes").select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
    if ((recent ?? 0) > 300) throw new Error("Muitas consultas de frete no momento. Tente em alguns minutos.");

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
        // valores zerados/vazios caem no padrão (Configurações → Melhor Envio)
        width: pos(p.width_cm) ?? defWidth,
        height: pos(p.height_cm) ?? defHeight,
        length: pos(p.length_cm) ?? defLength,
        weight: (pos(p.weight_g) ?? defWeight) / 1000, // ME usa kg
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
        "User-Agent": "BODYOGA (willy@magnificodigital.com)",
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

    // Guarda as cotações: o pedido só aceita um frete que o servidor calculou (ver place_order).
    if (options.length) {
      const cartKey = [...items].sort((a, b) => (a.product_id < b.product_id ? -1 : 1))
        .map((i) => `${i.product_id}:${i.qty}`).join(",");
      const { error: qErr } = await supabase.from("shipping_quotes").insert(
        options.map((o) => ({ cep: cleanCepDestino, cart_key: cartKey, service_id: o.id, price_cents: o.price_cents })),
      );
      if (qErr) console.error("shipping_quotes:", qErr.message);
    }

    return new Response(JSON.stringify({ options }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message, options: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
