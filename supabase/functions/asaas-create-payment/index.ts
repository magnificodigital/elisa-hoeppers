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
  return (data?.value as string | null)?.trim() ?? null;
}

function asaasBase(env: string): string {
  return env === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

async function ensureCustomer(params: {
  apiKey: string;
  base: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
}): Promise<string> {
  const { apiKey, base, userId, name, email, phone, cpfCnpj } = params;

  if (userId) {
    const { data: prof } = await supabase.from("profiles")
      .select("asaas_customer_id").eq("id", userId).maybeSingle();
    if (prof?.asaas_customer_id) return prof.asaas_customer_id as string;
  }

  const cleanCpf = cpfCnpj.replace(/\D/g, "");
  const searchRes = await fetch(`${base}/customers?cpfCnpj=${cleanCpf}`, {
    headers: { access_token: apiKey },
  });
  if (searchRes.ok) {
    const found = await searchRes.json();
    if (found?.data?.[0]?.id) {
      const cid = found.data[0].id as string;
      if (userId) {
        await supabase.from("profiles").update({ asaas_customer_id: cid, cpf_cnpj: cleanCpf }).eq("id", userId);
      }
      return cid;
    }
  }

  const createRes = await fetch(`${base}/customers`, {
    method: "POST",
    headers: { access_token: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      mobilePhone: phone.replace(/\D/g, ""),
      cpfCnpj: cleanCpf,
      notificationDisabled: false,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Asaas customer create failed: ${err}`);
  }
  const customer = await createRes.json();
  if (userId) {
    await supabase.from("profiles").update({
      asaas_customer_id: customer.id,
      cpf_cnpj: cleanCpf,
    }).eq("id", userId);
  }
  return customer.id as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    let userId: string | null = null;
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      userId = userData.user?.id ?? null;
    }

    const enabled = await getSetting("asaas_enabled");
    if (enabled !== "true") throw new Error("Gateway não está habilitado.");
    const apiKey = await getSetting("asaas_api_key");
    if (!apiKey) throw new Error("API key não configurada.");
    const env = (await getSetting("asaas_environment")) ?? "sandbox";
    const base = asaasBase(env);

    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id obrigatório");

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .maybeSingle();
    if (orderErr || !order) throw new Error("Pedido não encontrado");
    if (order.status !== "pending") throw new Error("Pedido não está pendente");

    const addr = (order.customer_address as any) ?? {};
    const cpfCnpj = addr.cpf_cnpj ?? addr.document ?? "";
    if (!cpfCnpj) throw new Error("CPF/CNPJ do cliente é obrigatório");

    const customerId = await ensureCustomer({
      apiKey, base, userId,
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      cpfCnpj,
    });

    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 1);
    const paymentPayload = {
      customer: customerId,
      billingType: "PIX",
      value: order.total_cents / 100,
      dueDate: dueDate.toISOString().split("T")[0],
      description: `Pedido #${order.code} — ${((order.items as any[]) ?? []).map((i) => `${i.qty}x ${i.name}`).join(", ").slice(0, 500)}`,
      externalReference: order.id,
      postalService: false,
    };

    const paymentRes = await fetch(`${base}/payments`, {
      method: "POST",
      headers: { access_token: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(paymentPayload),
    });
    if (!paymentRes.ok) {
      const err = await paymentRes.text();
      throw new Error(`Falha ao criar cobrança: ${err.slice(0, 400)}`);
    }
    const payment = await paymentRes.json();

    const qrRes = await fetch(`${base}/payments/${payment.id}/pixQrCode`, {
      headers: { access_token: apiKey },
    });
    if (!qrRes.ok) {
      const err = await qrRes.text();
      throw new Error(`Falha ao gerar PIX: ${err.slice(0, 400)}`);
    }
    const qr = await qrRes.json();

    await supabase.from("orders").update({
      asaas_customer_id: customerId,
      asaas_payment_id: payment.id,
      asaas_payment_status: payment.status,
      asaas_pix_qr_code_image: qr.encodedImage,
      asaas_pix_qr_code_copy_paste: qr.payload,
      asaas_pix_expires_at: qr.expirationDate,
      asaas_invoice_url: payment.invoiceUrl,
      payment_method_type: "pix",
    }).eq("id", order.id);

    return new Response(JSON.stringify({
      ok: true,
      payment_id: payment.id,
      qr_code_image: qr.encodedImage,
      qr_code_copy_paste: qr.payload,
      expires_at: qr.expirationDate,
    }), {
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
