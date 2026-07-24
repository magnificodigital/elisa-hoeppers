// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const FROM = "BODYOGA <contato@bodyogaoficial.com.br>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Branding editável dos emails (Admin → Configurações → Emails)
const emailBranding = {
  logo_url: "",
  brand_color: "#3B4F30",
  signature: "",
  footer_note: "bodyogaoficial.com.br",
};

async function loadEmailBranding() {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .eq("category", "emails");
    for (const row of data ?? []) {
      if (row.key === "email_logo_url") emailBranding.logo_url = row.value ?? "";
      else if (row.key === "email_brand_color" && row.value) emailBranding.brand_color = row.value;
      else if (row.key === "email_signature") emailBranding.signature = row.value ?? "";
      else if (row.key === "email_footer_note") emailBranding.footer_note = row.value ?? "";
    }
  } catch (e) {
    console.error("loadEmailBranding failed:", e);
  }
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #F5EBE2; color: #334C31; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 0 auto; padding: 24px; }
  .card { background: white; border-radius: 12px; padding: 32px; margin-top: 16px; }
  h1, h2, h3 { font-family: Georgia, serif; color: #3B4F30; }
  p { line-height: 1.6; margin: 8px 0; }
  a { color: #3B4F30; }
  .btn { display: inline-block; background: #3B4F30; color: white !important; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; font-size: 12px; margin-top: 16px; }
  .muted { color: #7A7A7A; font-size: 13px; }
`;

function wrap(body: string, unsubLink?: string): string {
  const header = emailBranding.logo_url
    ? `<div style="text-align:center;padding:8px 0 4px;"><img src="${emailBranding.logo_url}" alt="BODYOGA" style="max-height:56px;max-width:200px;height:auto;" /></div>`
    : "";
  const signature = emailBranding.signature
    ? `<p class="muted" style="text-align:center;margin-top:20px;color:${emailBranding.brand_color};">${emailBranding.signature}</p>`
    : "";
  const footer = emailBranding.footer_note || "bodyogaoficial.com.br";
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><style>${baseStyles}</style></head>
  <body>
    <div class="container">
      ${header}
      <div class="card">
        ${body}
      </div>
      ${signature}
      <p class="muted" style="text-align:center;margin-top:16px;">
        ${unsubLink ? `Quer parar de receber? <a href="${unsubLink}">Descadastrar</a><br/>` : ""}
        <a href="https://bodyogaoficial.com.br">${footer}</a>
      </p>
    </div>
  </body>
</html>`;
}

type Recipient = { email: string; name: string | null };

async function resolveRecipients(segmentType: string, segmentId: string | null): Promise<Recipient[]> {
  const emails = new Map<string, string | null>();

  if (segmentType === "newsletter") {
    const { data } = await supabase
      .from("newsletter_subscribers")
      .select("email, full_name")
      .is("unsubscribed_at", null);
    (data ?? []).forEach((r: any) => emails.set(r.email.toLowerCase(), r.full_name ?? null));

  } else if (segmentType === "course_enrolled" && segmentId) {
    const { data: rows } = await supabase
      .from("enrollments")
      .select("user_id")
      .eq("course_id", segmentId)
      .eq("status", "active");
    const ids = [...new Set((rows ?? []).map((r: any) => r.user_id))];
    for (const uid of ids) {
      const { data: u } = await supabase.auth.admin.getUserById(uid as string);
      const e = u?.user?.email;
      if (e) {
        const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
        emails.set(e.toLowerCase(), prof?.full_name ?? null);
      }
    }

  } else if (segmentType === "product_buyers" && segmentId) {
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_email, customer_name, items")
      .in("status", ["completed", "shipped"]);
    (orders ?? []).forEach((o: any) => {
      const has = Array.isArray(o.items) && o.items.some((it: any) => it.product_id === segmentId);
      if (has && o.customer_email) emails.set(o.customer_email.toLowerCase(), o.customer_name ?? null);
    });

  } else if (segmentType === "all_customers") {
    const { data: orders } = await supabase
      .from("orders")
      .select("customer_email, customer_name")
      .in("status", ["completed", "shipped"]);
    (orders ?? []).forEach((o: any) => {
      if (o.customer_email) emails.set(o.customer_email.toLowerCase(), o.customer_name ?? null);
    });

  } else if (segmentType === "all_students") {
    const { data: rows } = await supabase
      .from("enrollments")
      .select("user_id")
      .eq("status", "active");
    const ids = [...new Set((rows ?? []).map((r: any) => r.user_id))];
    for (const uid of ids) {
      const { data: u } = await supabase.auth.admin.getUserById(uid as string);
      const e = u?.user?.email;
      if (e) {
        const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle();
        emails.set(e.toLowerCase(), prof?.full_name ?? null);
      }
    }
  }

  const all = Array.from(emails.entries()).map(([email, name]) => ({ email, name }));

  // Remove quem desativou "Novidades e promoções" no perfil
  const { data: optedOut } = await supabase
    .from("profiles")
    .select("id")
    .eq("notify_marketing", false);
  const optOutEmails = new Set<string>();
  for (const p of optedOut ?? []) {
    const { data: u } = await supabase.auth.admin.getUserById((p as any).id);
    const e = u?.user?.email;
    if (e) optOutEmails.add(e.toLowerCase());
  }

  return all.filter((r) => !optOutEmails.has(r.email.toLowerCase()));
}

async function sendOne(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, await res.text());
    return false;
  }
  return true;
}

async function sendInBatches(
  recipients: Recipient[],
  subject: string,
  bodyHtml: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  const CHUNK = 8;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const slice = recipients.slice(i, i + CHUNK);
    const results = await Promise.all(slice.map((r) => {
      const personalized = bodyHtml.replace(/\{\{first_name\}\}/g, (r.name ?? "").split(" ")[0] || "");
      const isFullDoc = /<(!doctype|html)[\s>]/i.test(personalized.trim().slice(0, 200));
      const html = isFullDoc ? personalized : wrap(personalized);
      return sendOne(r.email, subject, html);
    }));
    sent += results.filter(Boolean).length;
    failed += results.filter((ok) => !ok).length;
    await new Promise((res) => setTimeout(res, 300));
  }
  return { sent, failed };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await loadEmailBranding();
    const { broadcast_id, test_email } = await req.json();
    if (!broadcast_id) {
      return new Response(JSON.stringify({ error: "broadcast_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: b, error } = await supabase
      .from("broadcasts")
      .select("*")
      .eq("id", broadcast_id)
      .maybeSingle();
    if (error || !b) throw new Error("broadcast not found");

    // ===== MODO TESTE: manda só pra um endereço =====
    if (test_email) {
      const personalized = b.body_html.replace(/\{\{first_name\}\}/g, "Teste");
      const isFullDoc = /<(!doctype|html)[\s>]/i.test(personalized.trim().slice(0, 200));
      const html = isFullDoc ? personalized : wrap(personalized);
      const ok = await sendOne(test_email, `[TESTE] ${b.subject}`, html);
      return new Response(JSON.stringify({ ok, test: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== ENVIO REAL =====
    await supabase.from("broadcasts").update({ status: "sending" }).eq("id", broadcast_id);

    const recipients = await resolveRecipients(b.segment_type, b.segment_id);
    if (recipients.length === 0) {
      await supabase.from("broadcasts").update({ status: "sent", sent_at: new Date().toISOString(), sent_count: 0 }).eq("id", broadcast_id);
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sent, failed } = await sendInBatches(recipients, b.subject, b.body_html);

    await supabase.from("broadcasts").update({
      status: failed > 0 && sent === 0 ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      sent_count: sent,
      failed_count: failed,
    }).eq("id", broadcast_id);

    return new Response(JSON.stringify({ ok: true, sent, failed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
