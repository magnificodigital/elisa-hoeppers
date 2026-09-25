// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Conciliação financeira da Pagar.me (cron diário + botão no admin).
 * Para cada pedido pago pela Pagar.me, busca os recebíveis (payables) de cada cobrança:
 * valor de cada parcela, taxa e data em que o dinheiro cai. Substitui a receita estimada
 * do pedido ("order:<id>") por lançamentos reais ("payable:<id>") + a taxa ("fee:<id>").
 * Body opcional: { order_id } para um pedido só, { probe: true } para testar o acesso.
 */

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const KEY = (Deno.env.get("PAGARME_SECRET_KEY") ?? "").trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const B = "https://api.pagar.me/core/v5";
const H = { Authorization: "Basic " + btoa(`${KEY}:`) };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function pg(path: string): Promise<{ ok: boolean; status: number; data: any }> {
  const r = await fetch(`${B}${path}`, { headers: H });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}

const day = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : null);

async function categoryId(slug: string): Promise<string | null> {
  const { data } = await supabase.from("fin_categories").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (!KEY) return json({ error: "sem PAGARME_SECRET_KEY" }, 400);
    const body = await req.json().catch(() => ({}));

    if (body?.probe) {
      const r = await pg("/payables?size=1");
      return json({ payables_access: r.ok, status: r.status, count: r.data?.data?.length ?? 0 });
    }

    let q = supabase
      .from("orders")
      .select("id, code, customer_name, payment_id, paid_at, total_cents")
      .eq("payment_method", "pagarme")
      .in("status", ["confirmed", "shipped", "completed"])
      .like("payment_id", "or_%");
    if (body?.order_id) q = q.eq("id", body.order_id);
    else q = q.gte("paid_at", new Date(Date.now() - 120 * 86400000).toISOString());
    const { data: orders, error } = await q.limit(200);
    if (error) throw error;

    const [vendas, taxas, estornos] = await Promise.all([categoryId("vendas"), categoryId("taxas"), categoryId("estornos")]);
    const report: any[] = [];

    for (const o of orders ?? []) {
      // Já conciliado e tudo recebido? pula.
      const { data: open } = await supabase
        .from("fin_entries")
        .select("id, external_ref, paid_at")
        .eq("order_id", o.id);
      const reconciled = (open ?? []).some((e) => e.external_ref?.startsWith("payable:"));
      const pendingPayables = (open ?? []).some((e) => e.external_ref?.startsWith("payable:") && !e.paid_at);
      if (reconciled && !pendingPayables && !body?.order_id) continue;

      const pgOrder = await pg(`/orders/${o.payment_id}`);
      if (!pgOrder.ok) { report.push({ order: o.code, error: `order ${pgOrder.status}` }); continue; }

      const payables: any[] = [];
      for (const ch of pgOrder.data?.charges ?? []) {
        const r = await pg(`/payables?charge_id=${encodeURIComponent(ch.id)}&size=100`);
        if (!r.ok) { report.push({ order: o.code, error: `payables ${r.status}` }); continue; }
        payables.push(...(r.data?.data ?? []));
      }
      if (payables.length === 0) { report.push({ order: o.code, payables: 0 }); continue; }

      const competence = day(o.paid_at) ?? day(new Date().toISOString())!;
      const total = payables.filter((p) => Number(p.amount) > 0).length;
      const rows: any[] = [];
      let n = 0;
      for (const p of payables.sort((a, b) => (a.installment ?? 0) - (b.installment ?? 0))) {
        const amount = Number(p.amount) || 0;
        const fee = (Number(p.fee) || 0) + (Number(p.anticipation_fee) || 0) + (Number(p.fraud_coverage_fee) || 0);
        const due = day(p.payment_date) ?? competence;
        const paidAt = p.status === "paid" ? due : null;
        if (amount < 0) {
          // estorno / chargeback
          rows.push({
            kind: "despesa", description: `Estorno Pagar.me — pedido #${o.code}`, category_id: estornos,
            amount_cents: Math.abs(amount), due_date: due, competence_date: due, paid_at: paidAt,
            counterparty: o.customer_name, order_id: o.id, source: "estorno", external_ref: `payable:${p.id}`,
          });
          continue;
        }
        n++;
        const parcela = total > 1 ? `${p.installment ?? n}/${total}` : null;
        rows.push({
          kind: "receita", description: `Pedido #${o.code}${parcela ? ` — parcela ${parcela}` : ""}`,
          category_id: vendas, amount_cents: amount, due_date: due, competence_date: competence, paid_at: paidAt,
          counterparty: o.customer_name, order_id: o.id, source: "pedido", installment: parcela,
          external_ref: `payable:${p.id}`, notes: `Pagar.me ${p.payment_method ?? ""}`.trim(),
        });
        if (fee > 0) {
          rows.push({
            kind: "despesa", description: `Taxa Pagar.me — pedido #${o.code}${parcela ? ` (${parcela})` : ""}`,
            category_id: taxas, amount_cents: fee, due_date: due, competence_date: competence, paid_at: paidAt,
            counterparty: "Pagar.me", order_id: o.id, source: "taxa", external_ref: `fee:${p.id}`,
          });
        }
      }

      const { error: upErr } = await supabase.from("fin_entries").upsert(rows, { onConflict: "external_ref" });
      if (upErr) { report.push({ order: o.code, error: upErr.message }); continue; }
      // A estimativa do pedido é substituída pelos recebíveis reais.
      await supabase.from("fin_entries").delete().eq("external_ref", `order:${o.id}`);
      report.push({ order: o.code, payables: payables.length });
    }

    return json({ ok: true, checked: orders?.length ?? 0, report });
  } catch (e) {
    console.error("fin-pagarme-sync:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
