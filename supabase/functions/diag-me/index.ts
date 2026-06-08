// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

  type Check = { id: string; label: string; status: "ok" | "warn" | "error"; detail: string };
  const checks: Check[] = [];

  const enabled = await getSetting("me_enabled");
  checks.push(enabled === "true"
    ? { id: "enabled", label: "Habilitar Melhor Envio (toggle)", status: "ok", detail: "Toggle ON." }
    : { id: "enabled", label: "Habilitar Melhor Envio (toggle)", status: "error", detail: "Toggle OFF. Ligue em /admin/configuracoes." });

  const token = await getSetting("me_access_token");
  if (!token) {
    checks.push({ id: "token", label: "Token de acesso", status: "error", detail: "Vazio." });
  } else {
    const parts = token.split(".");
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const expMs = (payload.exp ?? 0) * 1000;
        const daysLeft = Math.floor((expMs - Date.now()) / 86400000);
        if (daysLeft < 0) checks.push({ id: "token", label: "Token de acesso", status: "error", detail: `Vencido há ${Math.abs(daysLeft)} dias.` });
        else if (daysLeft < 30) checks.push({ id: "token", label: "Token de acesso", status: "warn", detail: `Vence em ${daysLeft} dias.` });
        else checks.push({ id: "token", label: "Token de acesso", status: "ok", detail: `Válido. Vence em ${daysLeft} dias.` });
      } catch {
        checks.push({ id: "token", label: "Token de acesso", status: "warn", detail: "JWT presente mas não pude decodificar." });
      }
    } else {
      checks.push({ id: "token", label: "Token de acesso", status: "error", detail: "Formato inválido (esperado JWT com 3 partes)." });
    }
  }

  const env = await getSetting("me_environment");
  checks.push({ id: "env", label: "Ambiente", status: env === "production" ? "ok" : "warn",
    detail: env === "production" ? "Production (saldo real)" : "Sandbox (saldo fictício)" });

  const cep = await getSetting("me_origin_cep");
  checks.push(cep && cep.replace(/\D/g, "").length === 8
    ? { id: "cep", label: "CEP de origem", status: "ok", detail: cep }
    : { id: "cep", label: "CEP de origem", status: "error", detail: "CEP ausente ou inválido." });

  const required = ["me_sender_name", "me_sender_document", "me_sender_phone", "me_sender_email", "me_sender_number", "me_sender_district", "me_sender_city_state", "me_origin_address"];
  const missing: string[] = [];
  for (const k of required) {
    const v = await getSetting(k);
    if (!v) missing.push(k);
  }
  checks.push(missing.length === 0
    ? { id: "sender", label: "Dados do remetente completos", status: "ok", detail: "Todos preenchidos." }
    : { id: "sender", label: "Dados do remetente completos", status: "error", detail: `Faltam: ${missing.join(", ")}` });

  if (token && enabled === "true" && cep) {
    try {
      const base = env === "production" ? "https://melhorenvio.com.br/api/v2" : "https://sandbox.melhorenvio.com.br/api/v2";
      const res = await fetch(`${base}/me/shipment/calculate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json", "Content-Type": "application/json",
          "User-Agent": "Diagnostico Elisa (willy@magnificodigital.com)",
        },
        body: JSON.stringify({
          from: { postal_code: cep.replace(/\D/g, "") },
          to: { postal_code: "01310100" },
          products: [{ id: "diag", width: 15, height: 10, length: 20, weight: 0.3, insurance_value: 50, quantity: 1 }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const validOpts = (data as any[]).filter((o: any) => !o.error && o.price);
        checks.push(validOpts.length > 0
          ? { id: "calc", label: "Teste de cálculo", status: "ok", detail: `${validOpts.length} opção(ões) disponíveis (PAC, SEDEX, etc).` }
          : { id: "calc", label: "Teste de cálculo", status: "warn", detail: "ME respondeu mas sem opções válidas. Verifique scopes do token." });
      } else {
        const txt = await res.text();
        checks.push({ id: "calc", label: "Teste de cálculo", status: "error", detail: `ME ${res.status}: ${txt.slice(0, 200)}` });
      }
    } catch (e) {
      checks.push({ id: "calc", label: "Teste de cálculo", status: "error", detail: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ checks }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
