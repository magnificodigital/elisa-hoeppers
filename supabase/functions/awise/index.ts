// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { awise, awiseConfigured, awiseError, awiseScope, listAllAwiseProducts, money, toCents } from "../_shared/awise.ts";

/**
 * Integração com a Awise (ERP da loja).
 *  - probe            : diagnóstico (empresa, filiais, formas de pagamento, locais de estoque, produtos)
 *  - sync_products    : Awise → site (vínculo por SKU/nome; estoque e custo; preço opcional)
 *  - push_order       : pedido pago no site → pedido faturado na Awise (+ NF-e se ligado)
 *  - push_pending     : reenvia pedidos pagos que ainda não foram pra Awise (cron)
 *  - update_shipping  : envia rastreio/status do envio pro pedido na Awise
 *  - register_webhook : cadastra o webhook da Awise apontando pro awise-webhook
 * Acesso: admin logado, ou chamadas internas (service role / cron).
 */

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function setting(key: string): Promise<string | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as string) ?? null;
}
const on = (v: string | null) => (v ?? "").toLowerCase() === "true";

async function isAllowed(req: Request): Promise<boolean> {
  // Chamadas internas (gatilho do banco / cron): token secreto guardado em app_settings.
  const internal = req.headers.get("x-internal-token");
  if (internal) return internal === (await setting("awise_webhook_token"));
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  if (token === SERVICE_KEY) return true;
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) {
    // Chave de serviço em outro formato (legada/nova): só ela consegue usar a API admin do Auth.
    const probe = createClient(SUPABASE_URL, token, { auth: { persistSession: false } });
    const { error } = await probe.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  }
  const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return p?.role === "admin";
}

const norm = (s: string) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function similarity(a: string, b: string): number {
  const A = new Set(norm(a).split(" ").filter((w) => w.length > 2));
  const B = new Set(norm(b).split(" ").filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let c = 0;
  for (const w of A) if (B.has(w)) c++;
  return c / Math.min(A.size, B.size);
}

// ---------------------------------------------------------------- produtos
async function applyAwiseProduct(ours: any, aw: any, syncPrice: boolean, syncStock: boolean) {
  const patch: Record<string, unknown> = {
    awise_product_id: aw.id,
    awise_meta_product_id: aw.metaProductId ?? null,
    awise_synced_at: new Date().toISOString(),
  };
  if (aw.code && !ours.sku) patch.sku = aw.code;
  const cost = toCents(aw.cost);
  if (cost > 0) patch.cost_cents = cost;
  const price = toCents(aw.price);
  if (syncPrice && price > 0) patch.price_cents = price;
  if (aw.ncm && !ours.ncm) patch.ncm = String(aw.ncm).replace(/\D/g, "").slice(0, 8);
  const { error } = await supabase.from("products").update(patch).eq("id", ours.id);
  if (error) throw error;

  // Estoque: a Awise é a fonte da verdade. Grava pela função que registra no histórico.
  const stock = Math.floor(parseFloat(aw.currentStock ?? "0") || 0);
  if (syncStock && ours.stock_qty !== stock) {
    const { error: e2 } = await supabase.rpc("awise_set_stock", { p_product_id: ours.id, p_qty: stock });
    if (e2) throw e2;
  }
  return { stock, price, cost };
}

async function syncProducts(opts: { onlyAwiseIds?: string[] } = {}) {
  const syncPrice = on(await setting("awise_sync_price"));
  const syncStock = on(await setting("awise_sync_stock"));
  const createMissing = on(await setting("awise_create_missing"));
  const awList = opts.onlyAwiseIds?.length
    ? await listAllAwiseProducts({ id: opts.onlyAwiseIds })
    : await listAllAwiseProducts();
  const { data: ours } = await supabase
    .from("products")
    .select("id, name, sku, price_cents, stock_qty, ncm, awise_product_id");
  const list = ours ?? [];
  const byAwise = new Map(list.filter((p) => p.awise_product_id).map((p) => [p.awise_product_id, p]));
  const bySku = new Map(list.filter((p) => p.sku).map((p) => [norm(p.sku!), p]));
  const used = new Set<string>(list.filter((p) => p.awise_product_id).map((p) => p.id));

  const report: any[] = [];
  for (const aw of awList) {
    const label = aw.name || aw.metaProductName;
    let p = byAwise.get(aw.id) ?? (aw.code ? bySku.get(norm(aw.code)) : undefined);
    let how = p ? (byAwise.has(aw.id) ? "vinculado" : "sku") : "";
    if (!p) {
      let best: { p: any; s: number } | null = null;
      for (const c of list) {
        if (used.has(c.id)) continue;
        const s = similarity(label, c.name);
        if (s >= 0.6 && (!best || s > best.s)) best = { p: c, s };
      }
      if (best) { p = best.p; how = "nome"; }
    }
    if (!p && createMissing) {
      const slug = norm(label).replace(/ /g, "-") + "-" + aw.id.toLowerCase();
      const { data: created, error } = await supabase.from("products").insert({
        name: label, slug, sku: aw.code || null, price_cents: toCents(aw.price), is_active: false,
        in_stock: false, gallery: (aw.imagesUrl ?? []).slice(0, 3).map((url: string) => ({ url, alt: label })),
        display_order: 999,
      }).select("id, name, sku, price_cents, stock_qty, ncm, awise_product_id").single();
      if (error) { report.push({ awise: label, error: error.message }); continue; }
      p = created; how = "criado (rascunho)";
    }
    if (!p) { report.push({ awise: label, code: aw.code, status: "sem produto no site" }); continue; }
    used.add(p.id);
    try {
      const r = await applyAwiseProduct(p, aw, syncPrice, syncStock);
      report.push({ awise: label, code: aw.code, site: p.name, how, stock: r.stock, price_awise: r.price / 100, price_site: p.price_cents / 100 });
    } catch (e) {
      report.push({ awise: label, site: p.name, error: (e as Error).message });
    }
  }
  const unlinked = list.filter((p) => !used.has(p.id)).map((p) => p.name);
  await supabase.from("app_settings").update({ value: new Date().toISOString() }).eq("key", "awise_last_sync");
  return { total_awise: awList.length, report, site_sem_vinculo: unlinked };
}

// ---------------------------------------------------------------- clientes
async function ibgeFromCep(cep: string): Promise<{ ibge?: string; district?: string }> {
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    return { ibge: d?.ibge, district: d?.bairro };
  } catch {
    return {};
  }
}

async function ensureCustomer(order: any): Promise<{ customerId?: string; nationalIdNum?: string }> {
  const a = order.customer_address ?? {};
  const doc = String(a.document ?? a.cpf_cnpj ?? a.cpf ?? "").replace(/\D/g, "");
  const cep = String(a.cep ?? a.zip ?? a.postal_code ?? order.shipping_destination_cep ?? "").replace(/\D/g, "");
  const geo = cep.length === 8 ? await ibgeFromCep(cep) : {};
  const contacts = [
    order.customer_email && { name: "", contactType: "email", value: order.customer_email },
    order.customer_phone && { name: "", contactType: "whatsapp", value: order.customer_phone },
  ].filter(Boolean);
  const customer = {
    personType: doc.length === 14 ? "leg" : "nat",
    name: order.customer_name,
    ...(doc ? { nationalIdNum: doc } : {}),
    status: "c",
    contacts,
    emailXml: order.customer_email ? [order.customer_email] : [],
    code: `site-${order.user_id ?? order.customer_email}`.slice(0, 60),
    observation: "Cliente da loja online (bodyogaoficial.com.br)",
    addresses: cep
      ? [{
          addressType: "m",
          cep,
          street: a.street ?? a.address ?? a.logradouro ?? "",
          number: String(a.number ?? a.numero ?? "S/N"),
          complement: a.complement ?? a.complemento ?? "",
          district: a.district ?? a.neighborhood ?? a.bairro ?? geo.district ?? "",
          cityName: a.city ?? a.cidade ?? "",
          state: a.state ?? a.uf ?? "",
          ...(geo.ibge ? { municipioId: geo.ibge } : {}),
        }]
      : [],
  };
  const r = await awise("POST", "/customers/", [customer]);
  const created = Array.isArray(r.data?.data) ? r.data.data[0] : r.data?.data;
  const id = created?.id ?? created?.customerId;
  if (r.ok && id) return { customerId: String(id) };
  // Já existe (mesmo CPF) → o pedido referencia pelo CPF.
  if (doc) return { nationalIdNum: doc };
  throw new Error(`Não foi possível cadastrar o cliente na Awise. ${awiseError(r)}`);
}

// ---------------------------------------------------------------- pedidos
async function pushOrder(orderId: string, force = false) {
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error || !order) throw new Error("Pedido não encontrado");
  if (!["confirmed", "shipped", "completed"].includes(order.status)) throw new Error("Pedido ainda não foi pago");
  if (order.awise_order_id && !force) return { already: order.awise_order_id };

  const items = order.items ?? [];
  const ids = items.map((i: any) => i.product_id).filter(Boolean);
  const { data: prods } = await supabase.from("products").select("id, name, sku, awise_product_id").in("id", ids);
  const pmap = new Map((prods ?? []).map((p) => [p.id, p]));
  const missing = items.filter((i: any) => {
    const p = pmap.get(i.product_id);
    return !p?.awise_product_id && !p?.sku;
  });
  if (missing.length) throw new Error(`Produto sem vínculo com a Awise: ${missing.map((i: any) => i.name).join(", ")}`);

  const cust = await ensureCustomer(order);
  const isPix = String(order.payment_method_type ?? "").includes("pix");
  const paymentConfigId =
    (await setting(isPix ? "awise_payment_pix_id" : "awise_payment_card_id")) || (await setting("awise_payment_card_id"));
  if (!paymentConfigId) {
    const msg = "Escolha a forma de pagamento da Awise em Configurações → Integrações → Awise.";
    await supabase.from("orders").update({ awise_error: msg }).eq("id", orderId);
    throw new Error(msg);
  }
  const paidAt = (order.paid_at ?? new Date().toISOString());

  const body: any = {
    ...cust,
    accrualDateTime: paidAt,
    observation: [
      `Pedido #${order.code} — loja online`,
      order.payment_id && `Pagar.me ${order.payment_id}${order.payment_installments > 1 ? ` (${order.payment_installments}x)` : ""}`,
      order.shipping_service_label && `Envio: ${order.shipping_service_label}`,
      order.notes,
    ].filter(Boolean).join(" · "),
    status: "billed",
    items: items.map((i: any) => {
      const p = pmap.get(i.product_id)!;
      return {
        ...(p.awise_product_id ? { productId: p.awise_product_id } : { productCode: p.sku }),
        quantity: String(i.qty),
        unitPrice: money(i.unit_price_cents),
        deliveryStatus: "delivered",
      };
    }),
    shipmentCosts: money(order.shipping_cents ?? 0),
    ...(order.discount_cents ? { discount: money(order.discount_cents) } : {}),
    source: { name: "Loja online", externalId: order.code },
  };
  body.billing = {
    payments: [{
      paymentConfigurationId: paymentConfigId,
      paymentCondition: "on_order",
      installments: [{ value: money(order.total_cents), dueDate: paidAt.slice(0, 10) }],
    }],
  };

  const r = await awise("POST", "/orders", body);
  if (!r.ok || !r.data?.data?.id) {
    const msg = awiseError(r);
    await supabase.from("orders").update({ awise_error: msg }).eq("id", order.id);
    throw new Error(msg);
  }
  const awId = String(r.data.data.id);
  await supabase.from("orders").update({ awise_order_id: awId, awise_error: null, awise_pushed_at: new Date().toISOString() }).eq("id", order.id);

  let invoice: unknown = null;
  if (on(await setting("awise_emit_nfe"))) invoice = await issueInvoice(order.id, awId);
  return { awise_order_id: awId, invoice };
}

async function issueInvoice(orderId: string, awId: string) {
  const r = await awise("POST", `/orders/${awId}/tax-invoice`, { model: "NFe" });
  if (!r.ok) {
    const msg = awiseError(r);
    await supabase.from("orders").update({ base_invoice_status: "ERRO", base_invoice_error: msg }).eq("id", orderId);
    return { error: msg };
  }
  await supabase.from("orders").update({ base_invoice_status: "PROCESSANDO", base_invoice_error: null }).eq("id", orderId);
  return { ok: true, id: r.data?.data?.id ?? null };
}

async function updateShipping(orderId: string) {
  const { data: o } = await supabase.from("orders").select("id, status, tracking_code, awise_order_id").eq("id", orderId).maybeSingle();
  if (!o?.awise_order_id) return { skipped: "sem pedido na Awise" };
  const status = o.status === "completed" ? "de" : o.status === "shipped" ? "it" : o.status === "cancelled" ? "ca" : "rs";
  const r = await awise("PATCH", `/orders/${o.awise_order_id}/shipping`, {
    status,
    ...(o.tracking_code ? { trackingCode: o.tracking_code, trackingUrl: `https://www.melhorrastreio.com.br/rastreio/${o.tracking_code}` } : {}),
  });
  return r.ok ? { ok: true, status } : { error: awiseError(r) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (!(await isAllowed(req))) return json({ error: "forbidden" }, 403);
    if (!awiseConfigured()) return json({ error: "AWISE_TOKEN não configurado" }, 400);
    const { action, ...p } = await req.json().catch(() => ({}));

    if (action === "probe") {
      const [companies, branches, pays, locations, products, hooks] = await Promise.all([
        awise("GET", "/companies"),
        awiseScope().then(({ companyId }) => awise("GET", `/companies/${companyId}/branches`)),
        awise("GET", "/payment-configurations?page[size]=100"),
        awise("GET", "/stock-locations"),
        awise("POST", "/products/list", { page_size: 100, page_number: 1, includeGroup: true, filter: { disabled: "onlyNotRemoved" } }),
        awise("GET", "/webhooks"),
      ]);
      const pick = (r: any, f: (x: any) => any) => (r.ok ? (r.data?.data ?? []).map(f) : { error: awiseError(r) });
      return json({
        companies: pick(companies, (c: any) => ({ id: c.id, name: c.attributes?.name ?? c.attributes?.legalName })),
        branches: pick(branches, (b: any) => ({ id: b.id, name: b.attributes?.name, cnpj: b.attributes?.nationalIdNum ?? b.attributes?.cnpj })),
        payment_configurations: pick(pays, (x: any) => ({ id: x.id, ...x.attributes })),
        stock_locations: pick(locations, (x: any) => ({ id: x.id, name: x.attributes?.name })),
        products: products.ok
          ? (products.data?.data ?? []).map((x: any) => ({
              id: x.id, meta: x.metaProductId, name: x.name || x.metaProductName, code: x.code, barCode: x.barCode,
              price: x.price, cost: x.cost, stock: x.currentStock, ncm: x.ncm, unit: x.unit, group: x.groupName,
              weight: x.grossWeight, images: x.totalImagesUrl,
            }))
          : { error: awiseError(products) },
        webhooks: hooks.ok ? hooks.data : { error: awiseError(hooks) },
      });
    }
    if (action === "raw") {
      // Depuração: só com a chave de serviço (nunca pelo navegador).
      const tk = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      const { data: u } = await supabase.auth.getUser(tk);
      if (u?.user) return json({ error: "forbidden" }, 403);
      const r = await awise(p.method ?? "GET", p.path, p.body);
      return json(r);
    }
    if (action === "options") {
      const [pays, prods, hooks] = await Promise.all([
        awise("GET", "/payment-configurations?page%5Bsize%5D=100"),
        listAllAwiseProducts().catch(() => []),
        awise("GET", "/webhooks"),
      ]);
      return json({
        payment_configurations: (pays.data?.data ?? [])
          .filter((x: any) => x.attributes?.sale && !x.attributes?.disabled)
          .map((x: any) => ({ id: x.id, name: x.attributes?.description })),
        products: prods.map((x: any) => ({
          id: x.id, name: x.name || x.metaProductName, code: x.code, stock: Number(x.currentStock ?? 0),
          price: toCents(x.price), cost: toCents(x.cost), ncm: x.ncm ?? null,
        })),
        webhook: ((hooks.data?.data ?? []) as any[]).find((w) => String(w.url ?? "").includes("/awise-webhook")) ?? null,
      });
    }
    if (action === "sync_products") return json(await syncProducts({ onlyAwiseIds: p.awise_ids }));
    if (action === "push_order") return json(await pushOrder(p.order_id, !!p.force));
    if (action === "issue_invoice") {
      const { data: o } = await supabase.from("orders").select("id, awise_order_id").eq("id", p.order_id).maybeSingle();
      if (!o?.awise_order_id) throw new Error("Pedido ainda não foi enviado pra Awise");
      return json(await issueInvoice(o.id, o.awise_order_id));
    }
    if (action === "update_shipping") return json(await updateShipping(p.order_id));
    if (action === "push_pending") {
      if (!on(await setting("awise_push_orders"))) return json({ skipped: "envio de pedidos desligado" });
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: pend } = await supabase
        .from("orders").select("id, code")
        .in("status", ["confirmed", "shipped", "completed"])
        .is("awise_order_id", null).gte("paid_at", since).limit(20);
      const out: any[] = [];
      for (const o of pend ?? []) {
        try { out.push({ code: o.code, ...(await pushOrder(o.id)) }); }
        catch (e) { out.push({ code: o.code, error: (e as Error).message }); }
      }
      return json({ ok: true, results: out });
    }
    if (action === "register_webhook") {
      const token = await setting("awise_webhook_token");
      const url = `${SUPABASE_URL}/functions/v1/awise-webhook?t=${token}`;
      const events = ["PRODUCT_STOCK_CHANGED", "PRODUCT_CHANGED", "PRICE_CHANGED", "PRODUCT_CREATED", "INVOICE_AUTHORIZED"];
      const existing = await awise("GET", "/webhooks");
      const list: any[] = existing.data?.data ?? [];
      const mine = list.find((w: any) => String(w.url ?? w.attributes?.url ?? "").includes("/awise-webhook"));
      const r = mine
        ? await awise("PATCH", `/webhooks/${mine.id}`, { url, events })
        : await awise("POST", "/webhooks", { url, events });
      return r.ok ? json({ ok: true, webhook: r.data?.data ?? r.data }) : json({ error: awiseError(r) }, 400);
    }
    return json({ error: "ação inválida" }, 400);
  } catch (e) {
    console.error("awise:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
