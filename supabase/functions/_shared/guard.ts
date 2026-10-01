// Quem está chamando a function? (todas rodam com verify_jwt=false, então a checagem é aqui)
//  - "service": outra function / cron / gatilho do banco (chave de serviço)
//  - "admin"  : usuário logado com profiles.role = 'admin'
//  - "user"   : usuário logado comum
//  - "anon"   : visitante (chave pública)
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export type Caller = { kind: "service" | "admin" | "user" | "anon"; userId?: string };

export async function getCaller(req: Request, supabase: SupabaseClient): Promise<Caller> {
  // Gatilhos do banco / cron: token interno guardado em app_settings (secreto).
  const internal = req.headers.get("x-internal-token");
  if (internal) {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "awise_webhook_token").maybeSingle();
    return data?.value && internal === data.value ? { kind: "service" } : { kind: "anon" };
  }
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { kind: "anon" };
  if (token === SERVICE_KEY) return { kind: "service" };

  const { data } = await supabase.auth.getUser(token);
  if (data?.user) {
    const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    return { kind: p?.role === "admin" ? "admin" : "user", userId: data.user.id };
  }
  // Chave de serviço em outro formato: só ela consegue usar a API admin do Auth.
  if (token.split(".").length === 3 || token.startsWith("sb_secret_")) {
    const probe = createClient(SUPABASE_URL, token, { auth: { persistSession: false } });
    const { error } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (!error) return { kind: "service" };
  }
  return { kind: "anon" };
}

export const isStaff = (c: Caller) => c.kind === "service" || c.kind === "admin";

export function forbidden(cors: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Escapa texto vindo do usuário antes de colocar em HTML de e-mail. */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Módulo ligado/desligado em Admin → Configurações → Módulos (app_settings, categoria "modulos"). */
export async function moduleEnabled(supabase: SupabaseClient, key: string, fallback = true): Promise<boolean> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (!data) return fallback;
  return String(data.value).toLowerCase() === "true";
}

export function moduleOffResponse(cors: Record<string, string> = {}, webhook = false) {
  // Webhook: responde 200 pra o provedor não ficar reenviando.
  return new Response(JSON.stringify(webhook ? { ok: true, ignored: "módulo desativado" } : { error: "Este módulo está desativado. Ative em Admin → Configurações → Módulos." }), {
    status: webhook ? 200 : 503,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
