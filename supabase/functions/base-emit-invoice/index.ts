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

function baseUrl(env: string): string {
  return env === "production"
    ? "https://api.baseerp.com.br"
    : "https://api-sandbox.baseerp.com.br";
}

async function baseCall(path: string, method: string, apiKey: string, env: string, body?: any) {
  const url = `${baseUrl(env)}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      access_token: apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Base ${method} ${path} ${res.status}: ${txt.slice(0, 500)}`);
  }
  return txt ? JSON.parse(txt) : {};
}

async function ensureBaseCustomer(params: {
  apiKey: string;
  env: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  address: any;
}): Promise<number> {
  const { apiKey, env, userId, name, email, phone, cpfCnpj, address } = params;

  if (userId) {
    const { data: prof } = await supabase.from("profiles")
      .select("base_customer_id").eq("id", userId).maybeSingle();
    if (prof?.base_customer_id) return prof.base_customer_id;
  }

  const cleanDoc = cpfCnpj.replace(/\D/g, "");
  try {
    const searchRes = await baseCall(`/api/v1/customers?cpfCnpj=${cleanDoc}`, "GET", apiKey, env);
    const found = searchRes?.data?.[0] ?? searchRes?.[0];
    if (found?.id) {
      if (userId) {
        await supabase.from("profiles").update({ base_customer_id: found.id }).eq("id", userId);
      }
      return found.id;
    }
  } catch (e) {
    console.warn("Base customer search failed:", e);
  }

  const cleanPhone = phone.replace(/\D/g, "");
  const customerPayload: any = {
    name: name.slice(0, 60),
    cpfCnpj: cleanDoc.slice(0, 14),
    email: email.slice(0, 60),
    mobilePhone: cleanPhone.slice(0, 14),
  };

  if (address?.cep || address?.postal_code) {
    const addr = {
      postalCode: (address.cep ?? address.postal_code ?? "").replace(/\D/g, "").slice(0, 8),
      address: (address.street ?? "").slice(0, 250),
      addressNumber: String(address.number ?? "S/N").slice(0, 10),
      complement: (address.complement ?? "").slice(0, 60),
      province: (address.district ?? "").slice(0, 60),
      cityName: (address.city ?? "").slice(0, 60),
      stateAbbrev: (address.state ?? "").slice(0, 2).toUpperCase(),
      country: "Brasil",
    };
    customerPayload.billingAddress = addr;
    customerPayload.deliveryAddress = { ...addr, name: customerPayload.name, cpfCnpj: cleanDoc, email, phone: cleanPhone };
  }

  const created = await baseCall("/api/v1/customers", "POST", apiKey, env, customerPayload);
  const customerId = created.id;
  if (userId && customerId) {
    await supabase.from("profiles").update({ base_customer_id: customerId }).eq("id", userId);
  }
  return customerId;
}

async function ensureBaseProduct(params: {
  apiKey: string;
  env: string;
  productId: string;
  name: string;
  price: number;
  ncm: string | null;
  unit: string | null;
  weightKg: number | null;
}): Promise<number> {
  const { apiKey, env, productId, name, price, ncm, unit, weightKg } = params;

  const { data: prod } = await supabase.from("products")
    .select("base_product_id, ncm, unit_of_measure, gross_weight_kg")
    .eq("id", productId).maybeSingle();
  if (prod?.base_product_id) return prod.base_product_id;

  const defaultNcm = (await getSetting("base_default_ncm")) ?? "00000000";
  const defaultUnit = (await getSetting("base_default_unit")) ?? "UN";
  const finalNcm = (ncm ?? prod?.ncm ?? defaultNcm).replace(/\D/g, "").slice(0, 8);
  const finalUnit = unit ?? prod?.unit_of_measure ?? defaultUnit;

  if (finalNcm === "00000000") {
    throw new Error(`Produto ${name} sem NCM válido. Configure em /admin/produtos ou em Configurações → Base ERP.`);
  }

  const productPayload: any = {
    name: name.slice(0, 120),
    code: `PROD-${productId.slice(0, 12)}`,
    unitPrice: price,
    ncm: finalNcm,
    unitOfMeasure: finalUnit,
    externalReference: productId,
  };
  if (weightKg != null) productPayload.grossWeight = weightKg;

  const created = await baseCall("/api/v1/products", "POST", apiKey, env, productPayload);
  const baseProductId = created.id;
  if (baseProductId) {
    await supabase.from("products").update({ base_product_id: baseProductId }).eq("id", productId);
  }
  return baseProductId;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let orderIdForError: string | null = null;
  try {
    const enabled = await getSetting("base_enabled");
    if (enabled !== "true") throw new Error("Base ERP não está habilitado");
    const apiKey = await getSetting("base_api_key");
    if (!apiKey) throw new Error("Base API key não configurada");
    const env = (await getSetting("base_environment")) ?? "sandbox";

    const body = await req.json();
    const order_id = body.order_id;
    orderIdForError = order_id;
    if (!order_id) throw new Error("order_id obrigatório");

    const { data: order, error: orderErr } = await supabase
      .from("orders").select("*").eq("id", order_id).maybeSingle();
    if (orderErr || !order) throw new Error("Pedido não encontrado");

    if (order.base_invoice_id) {
      return new Response(JSON.stringify({
        ok: true,
        already_emitted: true,
        invoice_id: order.base_invoice_id,
        status: order.base_invoice_status,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("orders").update({
      base_invoice_status: "PROCESSANDO",
      base_invoice_error: null,
    }).eq("id", order.id);

    const addr = (order.customer_address ?? {}) as any;
    const cpfCnpj = addr.cpf_cnpj ?? addr.document ?? "";
    if (!cpfCnpj) throw new Error("CPF/CNPJ do cliente é obrigatório pra emitir NFe");

    const baseCustomerId = await ensureBaseCustomer({
      apiKey, env,
      userId: order.user_id,
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      cpfCnpj,
      address: addr,
    });

    const items = order.items as any[];
    const orderItems: any[] = [];
    for (const item of items) {
      const { data: prod } = await supabase.from("products")
        .select("id, name, price_cents, ncm, unit_of_measure, gross_weight_kg")
        .eq("id", item.product_id).maybeSingle();
      if (!prod) throw new Error(`Produto ${item.product_id} não encontrado`);

      const baseProductId = await ensureBaseProduct({
        apiKey, env,
        productId: prod.id,
        name: prod.name,
        price: prod.price_cents / 100,
        ncm: prod.ncm,
        unit: prod.unit_of_measure,
        weightKg: prod.gross_weight_kg,
      });

      orderItems.push({
        productId: baseProductId,
        quantity: item.qty,
        unitPrice: item.unit_price_cents / 100,
      });
    }

    const orderNumber = parseInt(order.code.replace(/\D/g, "").slice(0, 8) || "0") || Date.now() % 100000000;
    const salesOrderPayload = {
      number: orderNumber,
      issueDate: new Date().toISOString().split("T")[0],
      customerId: baseCustomerId,
      orderItems,
      externalReference: order.id,
    };

    const salesOrder = await baseCall("/api/v1/salesOrders", "POST", apiKey, env, salesOrderPayload);
    const salesOrderId = salesOrder.id;

    await supabase.from("orders").update({
      base_customer_id: baseCustomerId,
      base_sales_order_id: salesOrderId,
    }).eq("id", order.id);

    const invoice = await baseCall(`/api/v1/salesOrders/${salesOrderId}/invoice`, "POST", apiKey, env, { type: "55" });

    await supabase.from("orders").update({
      base_invoice_id: invoice.invoiceId ?? invoice.id ?? null,
      base_invoice_number: invoice.invoiceNumber ?? null,
      base_invoice_status: invoice.invoiceStatus ?? "PROCESSANDO",
    }).eq("id", order.id);

    return new Response(JSON.stringify({
      ok: true,
      sales_order_id: salesOrderId,
      invoice_id: invoice.invoiceId ?? invoice.id,
      invoice_number: invoice.invoiceNumber,
      invoice_status: invoice.invoiceStatus,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("base-emit-invoice error:", err);
    const errorMsg = (err as Error).message;

    try {
      if (orderIdForError) {
        await supabase.from("orders").update({
          base_invoice_status: "ERRO",
          base_invoice_error: errorMsg.slice(0, 500),
        }).eq("id", orderIdForError);
      }
    } catch {}

    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
