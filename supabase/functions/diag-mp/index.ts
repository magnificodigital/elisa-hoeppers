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

type Check = {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  detail: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const checks: Check[] = [];

  // 1) Token presente — prioriza o secret; fallback pro banco durante a transição
  // @ts-ignore - Deno
  const token = Deno.env.get("MP_ACCESS_TOKEN") ?? await getSetting("mp_access_token");
  if (!token) {
    checks.push({ id: "token", label: "Access Token configurado", status: "error",
      detail: "Vazio em app_settings. Abra /admin/configuracoes e cole o Access Token do painel MP." });
  } else {
    const isProd = token.startsWith("APP_USR-");
    const isTest = token.startsWith("TEST-");
    if (isProd) checks.push({ id: "token", label: "Access Token configurado", status: "ok",
      detail: `PRODUÇÃO (${token.slice(0, 12)}...${token.slice(-4)})` });
    else if (isTest) checks.push({ id: "token", label: "Access Token configurado", status: "warn",
      detail: `SANDBOX/TESTE (${token.slice(0, 8)}...${token.slice(-4)}). Pagamentos não geram cobrança real.` });
    else checks.push({ id: "token", label: "Access Token configurado", status: "error",
      detail: `Token com formato inesperado. Deveria começar com APP_USR- (prod) ou TEST- (sandbox).` });
  }

  // 2) mp_enabled
  const enabled = await getSetting("mp_enabled");
  if (enabled === "true") {
    checks.push({ id: "enabled", label: "Habilitar Mercado Pago (toggle)", status: "ok",
      detail: "Toggle ON. Botão 'Pagar agora com Mercado Pago' aparece no /checkout." });
  } else {
    checks.push({ id: "enabled", label: "Habilitar Mercado Pago (toggle)", status: "error",
      detail: "Toggle OFF. Botão MP não aparece no /checkout. Abra /admin/configuracoes e ligue." });
  }

  // 3) Validade do token (chama /users/me da MP)
  if (token) {
    try {
      const meRes = await fetch("https://api.mercadopago.com/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        checks.push({ id: "validity", label: "Token aceito pelo Mercado Pago", status: "ok",
          detail: `Conta: ${me.nickname ?? me.email ?? me.id} (${me.site_id ?? "BR"})` });
      } else {
        const txt = await meRes.text();
        checks.push({ id: "validity", label: "Token aceito pelo Mercado Pago", status: "error",
          detail: `MP retornou ${meRes.status}: ${txt.slice(0, 200)}` });
      }
    } catch (e) {
      checks.push({ id: "validity", label: "Token aceito pelo Mercado Pago", status: "error",
        detail: `Erro de rede: ${(e as Error).message}` });
    }
  }

  // 4) URL do webhook esperada
  const webhookUrl = `${SUPABASE_URL}/functions/v1/mp-webhook`;
  checks.push({ id: "webhook", label: "URL do webhook (configurar no MP)", status: "warn",
    detail: `${webhookUrl} — copie pra "Notificações Webhooks" no painel MP > Sua aplicação. Eventos: 'Pagamentos'.` });

  // 5) back_urls
  checks.push({ id: "backurls", label: "Back URLs (SITE_URL atual)",
    status: SITE_URL.includes("bodyogaoficial.com") || SITE_URL.includes("lovable.app") || SITE_URL.includes("elisahoeppers.com.br") ? "ok" : "warn",
    detail: `SITE_URL = ${SITE_URL}. Sucesso/pending/falha vão pra ${SITE_URL}/pedido/<code>?status=...` });

  // 6) Tentativa real de criar preference (com order dummy)
  let testPrefResult: { ok: boolean; init_point?: string; error?: string } = { ok: false };
  if (token && enabled === "true") {
    try {
      const dummyPayload = {
        items: [{ id: "test-diag", title: "Diagnóstico (não é cobrança)", quantity: 1, unit_price: 1.00, currency_id: "BRL" }],
        payer: { name: "Teste", email: "teste@example.com" },
        back_urls: {
          success: `${SITE_URL}/pedido/DIAG?status=success`,
          pending: `${SITE_URL}/pedido/DIAG?status=pending`,
          failure: `${SITE_URL}/pedido/DIAG?status=failure`,
        },
        external_reference: "diag-test",
        statement_descriptor: "ELISA HOEPPERS",
      };
      const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(dummyPayload),
      });
      if (mpRes.ok) {
        const pref = await mpRes.json();
        testPrefResult = { ok: true, init_point: pref.init_point };
        checks.push({ id: "preference", label: "Criação de preference (teste real)", status: "ok",
          detail: `Preference criada com sucesso. init_point gerado.` });
      } else {
        const txt = await mpRes.text();
        testPrefResult = { ok: false, error: `${mpRes.status}: ${txt.slice(0, 300)}` };
        checks.push({ id: "preference", label: "Criação de preference (teste real)", status: "error",
          detail: `MP recusou: ${mpRes.status} — ${txt.slice(0, 300)}` });
      }
    } catch (e) {
      checks.push({ id: "preference", label: "Criação de preference (teste real)", status: "error",
        detail: `Erro: ${(e as Error).message}` });
    }
  } else {
    checks.push({ id: "preference", label: "Criação de preference (teste real)", status: "warn",
      detail: "Pulado — token ou toggle não configurados." });
  }

  return new Response(JSON.stringify({ checks, test_preference: testPrefResult }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
