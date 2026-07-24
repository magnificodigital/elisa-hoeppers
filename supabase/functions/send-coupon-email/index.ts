// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://bodyogaoficial.com.br";

const FROM = "BODYOGA <contato@bodyogaoficial.com.br>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function loadSettings(): Promise<Record<string, string>> {
  const { data } = await supabase.from("app_settings").select("key, value").in("category", ["cupom", "emails"]);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = (row.value as string) ?? "";
  return map;
}

function render(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => String(vars[k] ?? ""));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, email, full_name, discount_percent, expires_at, validity_days } = await req.json();
    if (!code || !email) {
      return new Response(JSON.stringify({ error: "code and email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const s = await loadSettings();
    const subject = s.coupon_email_subject || "Seu cupom BODYOGA";
    const headline = s.coupon_email_headline || "Bem-vinda ao ritual BODYOGA";
    const messageTpl = s.coupon_email_message ||
      "Aqui está seu cupom de {{discount}}% de desconto. Use no checkout — vale por {{validity_days}} dias.";

    const brandColor = s.email_brand_color || "#3B4F30";
    const logo = s.email_logo_url || "";
    const signature = s.email_signature || "";
    const footer = s.email_footer_note || "bodyogaoficial.com.br";

    const firstName = (full_name || "").split(" ")[0] || "";
    const message = render(messageTpl, {
      code,
      discount: discount_percent,
      validity_days: validity_days ?? "",
      name: firstName,
    });

    const expiresLine = expires_at
      ? `<p class="muted" style="color:#7A7A7A;font-size:13px;text-align:center;">Válido até ${new Date(expires_at).toLocaleDateString("pt-BR")}</p>`
      : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#F5EBE2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#334C31;">
      <div style="max-width:560px;margin:0 auto;padding:24px;">
        ${logo ? `<div style="text-align:center;padding:8px 0;"><img src="${logo}" alt="BODYOGA" style="max-height:56px;max-width:200px;height:auto;" /></div>` : ""}
        <div style="background:white;border-radius:12px;padding:32px;margin-top:16px;text-align:center;">
          <h1 style="font-family:Georgia,serif;color:${brandColor};font-size:28px;margin:0 0 16px;">${headline}</h1>
          <p style="line-height:1.6;margin:8px 0;font-size:16px;">${message}</p>
          <div style="margin:28px auto;padding:20px;border:2px dashed ${brandColor};border-radius:12px;display:inline-block;">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#7A7A7A;margin:0 0 8px;">Seu cupom</p>
            <p style="font-family:Menlo,monospace;font-size:26px;font-weight:bold;color:${brandColor};margin:0;letter-spacing:0.08em;">${code}</p>
            <p style="font-size:12px;color:#7A7A7A;margin:8px 0 0;">${discount_percent}% de desconto</p>
          </div>
          ${expiresLine}
          <div style="margin-top:20px;">
            <a href="${SITE_URL}/loja" style="display:inline-block;background:${brandColor};color:white;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;font-size:12px;">Usar cupom agora</a>
          </div>
        </div>
        ${signature ? `<p style="text-align:center;color:${brandColor};font-size:13px;margin-top:20px;">${signature}</p>` : ""}
        <p style="color:#7A7A7A;font-size:12px;text-align:center;margin-top:24px;">${footer}</p>
      </div>
    </body></html>`;

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing; skipping email");
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [email], subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error", res.status, err);
      return new Response(JSON.stringify({ error: `Resend ${res.status}: ${err}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
