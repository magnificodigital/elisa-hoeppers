import { supabase } from "./supabase";

export type FinKind = "receita" | "despesa";

export type DreGroup =
  | "receita_bruta"
  | "deducoes"
  | "taxas_vendas"
  | "frete"
  | "impostos"
  | "despesas_operacionais"
  | "outras_receitas"
  | "outras_despesas"
  | "estoque"
  | "investimentos";

export type FinCategory = {
  id: string;
  name: string;
  kind: FinKind;
  dre_group: DreGroup;
  slug: string | null;
  display_order: number;
  active: boolean;
};

export type FinEntry = {
  id: string;
  kind: FinKind;
  description: string;
  category_id: string | null;
  amount_cents: number;
  due_date: string; // YYYY-MM-DD
  competence_date: string;
  paid_at: string | null;
  counterparty: string | null;
  supplier_id: string | null;
  order_id: string | null;
  purchase_id: string | null;
  source: "manual" | "pedido" | "estorno" | "taxa" | "frete" | "compra" | "recorrente";
  installment: string | null;
  recurrence_group: string | null;
  notes: string | null;
};

export const DRE_GROUP_LABEL: Record<DreGroup, string> = {
  receita_bruta: "Receita bruta",
  deducoes: "Estornos e devoluções",
  taxas_vendas: "Taxas de pagamento",
  frete: "Frete de envio",
  impostos: "Impostos",
  despesas_operacionais: "Despesas operacionais",
  outras_receitas: "Outras receitas",
  outras_despesas: "Outras despesas",
  estoque: "Compra de mercadorias (vai para o estoque)",
  investimentos: "Investimentos",
};

export const SOURCE_LABEL: Record<FinEntry["source"], string> = {
  manual: "Manual",
  pedido: "Venda",
  estorno: "Estorno",
  taxa: "Taxa",
  frete: "Etiqueta",
  compra: "Nota de compra",
  recorrente: "Recorrente",
};

// ---------- datas (sempre em "YYYY-MM-DD", fuso local) ----------
export function today(): string {
  const d = new Date();
  return toISODate(d);
}
export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const last = new Date(y, m - 1 + months + 1, 0).getDate();
  return toISODate(new Date(y, m - 1 + months, Math.min(d, last)));
}
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}
export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}
export function monthEnd(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return toISODate(new Date(y, m, 0));
}
export function monthLabel(key: string, short = true): string {
  const [y, m] = key.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: short ? "short" : "long", year: "numeric" });
  return s.replace(".", "").replace(" de ", "/");
}
export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}
export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type EntryStatus = "pago" | "vencido" | "hoje" | "aberto";
export function entryStatus(e: Pick<FinEntry, "paid_at" | "due_date">): EntryStatus {
  if (e.paid_at) return "pago";
  const t = today();
  if (e.due_date < t) return "vencido";
  if (e.due_date === t) return "hoje";
  return "aberto";
}

// ---------- queries ----------
export async function listCategories(): Promise<FinCategory[]> {
  const { data, error } = await supabase
    .from("fin_categories")
    .select("id, name, kind, dre_group, slug, display_order, active")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FinCategory[];
}

const ENTRY_COLS =
  "id, kind, description, category_id, amount_cents, due_date, competence_date, paid_at, counterparty, supplier_id, order_id, purchase_id, source, installment, recurrence_group, notes";

/** Lançamentos cujo vencimento, pagamento OU competência caem no período. */
export async function listEntries(from: string, to: string): Promise<FinEntry[]> {
  const { data, error } = await supabase
    .from("fin_entries")
    .select(ENTRY_COLS)
    .or(
      `and(due_date.gte.${from},due_date.lte.${to}),and(paid_at.gte.${from},paid_at.lte.${to}),and(competence_date.gte.${from},competence_date.lte.${to})`,
    )
    .order("due_date", { ascending: true })
    .limit(5000);
  if (error) throw error;
  return (data ?? []) as FinEntry[];
}

/** Tudo em aberto (qualquer data) — base de "a pagar / a receber". */
export async function listOpenEntries(): Promise<FinEntry[]> {
  const { data, error } = await supabase
    .from("fin_entries")
    .select(ENTRY_COLS)
    .is("paid_at", null)
    .order("due_date", { ascending: true })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as FinEntry[];
}

/** Soma do que já foi pago/recebido até uma data (para saldo). */
export async function realizedUntil(from: string, until: string): Promise<{ in: number; out: number }> {
  const { data, error } = await supabase
    .from("fin_entries")
    .select("kind, amount_cents")
    .gte("paid_at", from)
    .lte("paid_at", until)
    .limit(20000);
  if (error) throw error;
  let inn = 0;
  let out = 0;
  for (const r of data ?? []) {
    if (r.kind === "receita") inn += r.amount_cents;
    else out += r.amount_cents;
  }
  return { in: inn, out };
}

export async function getFinSettings(): Promise<{ openingCents: number; openingDate: string; cardDays: number }> {
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["fin_opening_balance_cents", "fin_opening_date", "fin_card_days"]);
  const m = new Map((data ?? []).map((r) => [r.key, r.value as string]));
  return {
    openingCents: parseInt(m.get("fin_opening_balance_cents") ?? "0") || 0,
    openingDate: m.get("fin_opening_date") || "2026-01-01",
    cardDays: parseInt(m.get("fin_card_days") ?? "30") || 30,
  };
}

export async function saveFinSetting(key: string, value: string) {
  const { error } = await supabase.from("app_settings").update({ value }).eq("key", key);
  if (error) throw error;
}

export type EntryInput = Omit<FinEntry, "id" | "supplier_id" | "order_id" | "purchase_id" | "installment" | "recurrence_group"> & {
  installment?: string | null;
  recurrence_group?: string | null;
};

/** Cria um lançamento; com `repeat` > 1 cria a série mensal (recorrente) ou parcelada. */
export async function createEntry(input: EntryInput, repeat = 1, mode: "recorrente" | "parcelado" = "recorrente") {
  if (repeat <= 1) {
    const { error } = await supabase.from("fin_entries").insert(input);
    if (error) throw error;
    return;
  }
  const group = crypto.randomUUID();
  const rows = Array.from({ length: repeat }, (_, i) => {
    const parcela = mode === "parcelado" ? `${i + 1}/${repeat}` : null;
    // parcelado: o valor informado é o TOTAL, dividido nas parcelas (resto na primeira)
    const base = Math.floor(input.amount_cents / repeat);
    const amount = mode === "parcelado" ? base + (i === 0 ? input.amount_cents - base * repeat : 0) : input.amount_cents;
    return {
      ...input,
      amount_cents: amount,
      due_date: addMonths(input.due_date, i),
      competence_date: mode === "parcelado" ? input.competence_date : addMonths(input.competence_date, i),
      paid_at: i === 0 ? input.paid_at : null,
      source: mode === "recorrente" ? "recorrente" : input.source,
      installment: parcela,
      recurrence_group: group,
      description: parcela ? `${input.description} (${parcela})` : input.description,
    };
  });
  const { error } = await supabase.from("fin_entries").insert(rows);
  if (error) throw error;
}

export async function updateEntry(id: string, patch: Partial<FinEntry>) {
  const { error } = await supabase.from("fin_entries").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteEntry(id: string, wholeSeriesFrom?: { group: string; due: string }) {
  const q = wholeSeriesFrom
    ? supabase.from("fin_entries").delete().eq("recurrence_group", wholeSeriesFrom.group).gte("due_date", wholeSeriesFrom.due).is("paid_at", null)
    : supabase.from("fin_entries").delete().eq("id", id);
  const { error } = await q;
  if (error) throw error;
}

export async function getCmv(from: string, to: string): Promise<Map<string, { cmv: number; missing: number }>> {
  const { data, error } = await supabase.rpc("fin_cmv", { p_from: from, p_to: to });
  if (error) throw error;
  const m = new Map<string, { cmv: number; missing: number }>();
  for (const r of (data ?? []) as { month: string; cmv_cents: number; items_without_cost: number }[]) {
    m.set(monthKey(r.month), { cmv: Number(r.cmv_cents), missing: Number(r.items_without_cost) });
  }
  return m;
}

// ---------- DRE ----------
export type DreMonth = {
  key: string;
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  cmv: number;
  cmvMissing: number;
  lucroBruto: number;
  taxas: number;
  frete: number;
  despesasOperacionais: number;
  impostos: number;
  outrasReceitas: number;
  outrasDespesas: number;
  resultado: number;
  porCategoria: Map<string, number>; // category_id → valor (despesas operacionais)
};

export function buildDre(
  months: string[],
  entries: FinEntry[],
  categories: FinCategory[],
  cmv: Map<string, { cmv: number; missing: number }>,
): DreMonth[] {
  const cat = new Map(categories.map((c) => [c.id, c]));
  return months.map((key) => {
    const m: DreMonth = {
      key, receitaBruta: 0, deducoes: 0, receitaLiquida: 0, cmv: cmv.get(key)?.cmv ?? 0,
      cmvMissing: cmv.get(key)?.missing ?? 0, lucroBruto: 0, taxas: 0, frete: 0, despesasOperacionais: 0,
      impostos: 0, outrasReceitas: 0, outrasDespesas: 0, resultado: 0, porCategoria: new Map(),
    };
    for (const e of entries) {
      if (monthKey(e.competence_date) !== key) continue;
      const c = e.category_id ? cat.get(e.category_id) : undefined;
      const group: DreGroup = c?.dre_group ?? (e.kind === "receita" ? "outras_receitas" : "outras_despesas");
      const v = e.amount_cents;
      switch (group) {
        case "receita_bruta": m.receitaBruta += e.kind === "receita" ? v : -v; break;
        case "deducoes": m.deducoes += v; break;
        case "taxas_vendas": m.taxas += v; break;
        case "frete": m.frete += v; break;
        case "impostos": m.impostos += v; break;
        case "despesas_operacionais":
          m.despesasOperacionais += v;
          if (e.category_id) m.porCategoria.set(e.category_id, (m.porCategoria.get(e.category_id) ?? 0) + v);
          break;
        case "outras_receitas": m.outrasReceitas += e.kind === "receita" ? v : -v; break;
        case "outras_despesas": m.outrasDespesas += v; break;
        // estoque e investimentos: saem do caixa, mas não são resultado do mês
      }
    }
    m.receitaLiquida = m.receitaBruta - m.deducoes;
    m.lucroBruto = m.receitaLiquida - m.cmv;
    m.resultado =
      m.lucroBruto - m.taxas - m.frete - m.despesasOperacionais - m.impostos + m.outrasReceitas - m.outrasDespesas;
    return m;
  });
}
