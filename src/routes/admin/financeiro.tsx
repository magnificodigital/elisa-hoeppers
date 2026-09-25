import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Landmark, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatBRLInput } from "@/lib/currency";
import {
  addDays,
  addMonths,
  brl,
  buildDre,
  DRE_GROUP_LABEL,
  entryStatus,
  getCmv,
  getFinSettings,
  listCategories,
  listEntries,
  listOpenEntries,
  monthEnd,
  monthKey,
  monthLabel,
  monthStart,
  realizedUntil,
  saveFinSetting,
  today,
  type DreGroup,
  type FinCategory,
  type FinEntry,
  type FinKind,
} from "@/lib/finance";
import { EntryDialog, FinField, finInputCls } from "@/components/admin/finance/EntryDialog";
import { EntryList } from "@/components/admin/finance/EntryList";
import { CashFlow, Dre } from "@/components/admin/finance/Reports";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Admin — Financeiro" }] }),
  component: FinancePage,
});

type Tab = "resumo" | "contas" | "fluxo" | "dre" | "ajustes";
const TABS: [Tab, string][] = [
  ["resumo", "Resumo"],
  ["contas", "Contas"],
  ["fluxo", "Fluxo de caixa"],
  ["dre", "DRE"],
  ["ajustes", "Ajustes"],
];

function readTab(): Tab {
  try {
    const t = localStorage.getItem("fin.tab") as Tab | null;
    return t && TABS.some(([id]) => id === t) ? t : "resumo";
  } catch {
    return "resumo";
  }
}

function FinancePage() {
  const qc = useQueryClient();
  const [tab, setTabState] = useState<Tab>("resumo");
  useEffect(() => setTabState(readTab()), []);
  const setTab = (t: Tab) => {
    setTabState(t);
    try { localStorage.setItem("fin.tab", t); } catch { /* sem storage */ }
  };
  const [dialog, setDialog] = useState<{ entry?: FinEntry | null; kind?: FinKind } | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ["fin", "categories"], queryFn: listCategories });

  const sync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fin-pagarme-sync", { body: {} });
      if (error) throw error;
      return data as { checked: number; report: { order: string; payables?: number; error?: string }[] };
    },
    onSuccess: (d) => {
      const ok = d.report.filter((r) => r.payables).length;
      toast.success(ok ? `${ok} venda(s) conciliada(s) com a Pagar.me.` : "Nada novo para conciliar.");
      qc.invalidateQueries({ queryKey: ["fin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="py-10 md:py-14 bg-background min-h-[70vh]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl text-primary-dark">Financeiro</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
              title="Busca na Pagar.me as parcelas, taxas e datas reais de recebimento"
              className="inline-flex items-center gap-1.5 border border-border text-primary-dark px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-semibold hover:border-primary disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sync.isPending ? "animate-spin" : ""}`} /> Conciliar Pagar.me
            </button>
            <button
              type="button"
              onClick={() => setDialog({ kind: "despesa" })}
              className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-semibold hover:bg-primary-dark"
            >
              <Plus className="w-3.5 h-3.5" /> Lançamento
            </button>
          </div>
        </div>
        <p className="text-sm text-primary-dark/60 mb-6">
          Vendas pagas, taxas da Pagar.me, etiquetas e notas de fornecedor entram sozinhas. Aqui você lança o resto
          (anúncios, contador, impostos…) e acompanha o caixa e o lucro.
        </p>

        <div className="flex gap-1 overflow-x-auto border-b border-border mb-6 -mx-4 px-4">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap border-b-2 -mb-px transition ${
                tab === id ? "border-primary text-primary font-semibold" : "border-transparent text-primary-dark/60 hover:text-primary-dark"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "resumo" && <Overview categories={categories} onEdit={(e) => setDialog({ entry: e })} goTo={setTab} />}
        {tab === "contas" && <Accounts categories={categories} onEdit={(e) => setDialog({ entry: e })} onNew={(k) => setDialog({ kind: k })} />}
        {tab === "fluxo" && <CashFlow />}
        {tab === "dre" && <Dre categories={categories} />}
        {tab === "ajustes" && <Settings categories={categories} />}
      </div>

      {dialog && (
        <EntryDialog entry={dialog.entry} defaultKind={dialog.kind} categories={categories} onClose={() => setDialog(null)} />
      )}
    </section>
  );
}

// ================= RESUMO =================
function Overview({ categories, onEdit, goTo }: { categories: FinCategory[]; onEdit: (e: FinEntry) => void; goTo: (t: Tab) => void }) {
  const t = today();
  const { data } = useQuery({
    queryKey: ["fin", "overview", t],
    queryFn: async () => {
      const s = await getFinSettings();
      const [realized, open, monthEntries, cmv] = await Promise.all([
        realizedUntil(s.openingDate, t),
        listOpenEntries(),
        listEntries(monthStart(t), monthEnd(t)),
        getCmv(monthStart(t), monthEnd(t)),
      ]);
      return { s, realized, open, monthEntries, cmv };
    },
  });

  if (!data) return <p className="text-[var(--text-muted)]">Carregando…</p>;

  const balance = data.s.openingCents + data.realized.in - data.realized.out;
  const in30 = addDays(t, 30);
  const receber = data.open.filter((e) => e.kind === "receita" && e.due_date <= in30);
  const pagar = data.open.filter((e) => e.kind === "despesa" && e.due_date <= in30);
  const sum = (l: FinEntry[]) => l.reduce((a, e) => a + e.amount_cents, 0);
  const overdue = data.open.filter((e) => entryStatus(e) === "vencido" || entryStatus(e) === "hoje");
  const next7 = data.open.filter((e) => e.due_date > t && e.due_date <= addDays(t, 7));
  const [month] = buildDre([monthKey(t)], data.monthEntries, categories, data.cmv);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Saldo em caixa hoje" value={brl(balance)} tone={balance < 0 ? "bad" : undefined} hint={`Desde ${data.s.openingDate.split("-").reverse().join("/")}`} />
        <Stat label="A receber (30 dias)" value={brl(sum(receber))} tone="good" hint={`${receber.length} lançamento(s)`} />
        <Stat label="A pagar (30 dias)" value={brl(sum(pagar))} tone="bad" hint={`${pagar.length} conta(s)`} />
        <Stat
          label={`Resultado de ${monthLabel(monthKey(t), false).split("/")[0]}`}
          value={brl(month.resultado)}
          tone={month.resultado < 0 ? "bad" : "good"}
          hint={`Vendas ${brl(month.receitaBruta)}`}
        />
      </div>

      <Panel title={`Vencidas e para hoje (${overdue.length})`} action={<button type="button" onClick={() => goTo("contas")} className="text-xs uppercase tracking-widest text-primary">Ver todas</button>}>
        <EntryList entries={overdue} categories={categories} onEdit={onEdit} empty="Nada vencido. 🌿" />
      </Panel>
      <Panel title={`Próximos 7 dias (${next7.length})`}>
        <EntryList entries={next7} categories={categories} onEdit={onEdit} empty="Nada vence nos próximos 7 dias." />
      </Panel>
    </div>
  );
}

// ================= CONTAS =================
type StatusFilter = "abertas" | "vencidas" | "pagas" | "todas";

function Accounts({ categories, onEdit, onNew }: { categories: FinCategory[]; onEdit: (e: FinEntry) => void; onNew: (k: FinKind) => void }) {
  const [month, setMonth] = useState(monthStart(today()));
  const [kind, setKind] = useState<"todas" | FinKind>("todas");
  const [status, setStatus] = useState<StatusFilter>("todas");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  const from = monthStart(month);
  const to = monthEnd(month);
  const { data: entries = [] } = useQuery({
    queryKey: ["fin", "entries", from],
    queryFn: () => listEntries(from, to),
  });

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries
      .filter((e) => e.due_date >= from && e.due_date <= to)
      .filter((e) => kind === "todas" || e.kind === kind)
      .filter((e) => !cat || e.category_id === cat)
      .filter((e) => {
        const st = entryStatus(e);
        if (status === "abertas") return st !== "pago";
        if (status === "vencidas") return st === "vencido";
        if (status === "pagas") return st === "pago";
        return true;
      })
      .filter((e) => !needle || `${e.description} ${e.counterparty ?? ""}`.toLowerCase().includes(needle));
  }, [entries, from, to, kind, cat, status, q]);

  const totIn = list.filter((e) => e.kind === "receita").reduce((a, e) => a + e.amount_cents, 0);
  const totOut = list.filter((e) => e.kind === "despesa").reduce((a, e) => a + e.amount_cents, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMonth(addMonths(month, -1))} className="p-1.5 rounded-full hover:bg-sand"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-display text-xl text-primary-dark capitalize w-44 text-center">{monthLabel(monthKey(month), false)}</span>
          <button type="button" onClick={() => setMonth(addMonths(month, 1))} className="p-1.5 rounded-full hover:bg-sand"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onNew("despesa")} className="px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-semibold border border-red-700 text-red-700 hover:bg-red-50">+ A pagar</button>
          <button type="button" onClick={() => onNew("receita")} className="px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-semibold border border-primary text-primary hover:bg-primary/5">+ A receber</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={finInputCls}>
          <option value="todas">Pagar e receber</option>
          <option value="despesa">Só a pagar</option>
          <option value="receita">Só a receber</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={finInputCls}>
          <option value="todas">Todas</option>
          <option value="abertas">Em aberto</option>
          <option value="vencidas">Vencidas</option>
          <option value="pagas">Pagas / recebidas</option>
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={finInputCls}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className={`${finInputCls} pl-9`} />
        </div>
      </div>

      <div className="bg-white border border-border/20 rounded-lg px-4">
        <EntryList entries={list} categories={categories} onEdit={onEdit} empty="Nenhum lançamento com vencimento neste mês." />
      </div>

      <div className="flex flex-wrap justify-end gap-6 text-sm">
        <span className="text-primary">Entradas {brl(totIn)}</span>
        <span className="text-red-700">Saídas {brl(totOut)}</span>
        <span className={`font-medium ${totIn - totOut < 0 ? "text-red-700" : "text-primary-dark"}`}>Saldo {brl(totIn - totOut)}</span>
      </div>
    </div>
  );
}

// ================= AJUSTES =================
function Settings({ categories }: { categories: FinCategory[] }) {
  const qc = useQueryClient();
  const { data: s } = useQuery({ queryKey: ["fin", "settings"], queryFn: getFinSettings });
  const [opening, setOpening] = useState<string | null>(null);
  const [openingDate, setOpeningDate] = useState<string | null>(null);
  const [cardDays, setCardDays] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ name: "", kind: "despesa" as FinKind, group: "despesas_operacionais" as DreGroup });

  const saveSettings = useMutation({
    mutationFn: async () => {
      if (!s) return;
      if (opening !== null) await saveFinSetting("fin_opening_balance_cents", String(formatBRLInput(opening).cents));
      if (openingDate !== null) await saveFinSetting("fin_opening_date", openingDate);
      if (cardDays !== null) await saveFinSetting("fin_card_days", String(Math.max(0, parseInt(cardDays) || 0)));
    },
    onSuccess: () => { toast.success("Ajustes salvos."); qc.invalidateQueries({ queryKey: ["fin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const catMut = useMutation({
    mutationFn: async (op: { type: "add" } | { type: "toggle"; c: FinCategory } | { type: "rename"; c: FinCategory; name: string }) => {
      if (op.type === "add") {
        if (!newCat.name.trim()) throw new Error("Informe o nome.");
        const { error } = await supabase.from("fin_categories").insert({
          name: newCat.name.trim(), kind: newCat.kind, dre_group: newCat.group, display_order: 50,
        });
        if (error) throw error;
      } else if (op.type === "toggle") {
        const { error } = await supabase.from("fin_categories").update({ active: !op.c.active }).eq("id", op.c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fin_categories").update({ name: op.name }).eq("id", op.c.id);
        if (error) throw error;
      }
    },
    onSuccess: (_d, op) => {
      if (op.type === "add") setNewCat({ ...newCat, name: "" });
      qc.invalidateQueries({ queryKey: ["fin", "categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const groupsFor = (k: FinKind): DreGroup[] =>
    k === "receita"
      ? ["receita_bruta", "outras_receitas"]
      : ["despesas_operacionais", "impostos", "taxas_vendas", "frete", "deducoes", "outras_despesas", "estoque", "investimentos"];

  return (
    <div className="space-y-6">
      <Panel title="Saldo inicial">
        {s && (
          <form onSubmit={(e) => { e.preventDefault(); saveSettings.mutate(); }} className="space-y-4 py-2">
            <p className="text-sm text-[var(--text-muted)]">
              Quanto havia em conta (banco + Pagar.me) no dia em que começou a usar o financeiro. O saldo em caixa parte daqui.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FinField label="Saldo inicial">
                <input
                  inputMode="numeric"
                  value={opening ?? formatBRLInput(String(Math.abs(s.openingCents))).display}
                  onChange={(e) => setOpening(formatBRLInput(e.target.value).display)}
                  placeholder="R$ 0,00"
                  className={finInputCls}
                />
              </FinField>
              <FinField label="Na data">
                <input type="date" value={openingDate ?? s.openingDate} onChange={(e) => setOpeningDate(e.target.value)} className={finInputCls} />
              </FinField>
              <FinField label="Cartão cai em (dias)" hint="Estimativa até a conciliação trazer a data real">
                <input type="number" min="0" value={cardDays ?? String(s.cardDays)} onChange={(e) => setCardDays(e.target.value)} className={finInputCls} />
              </FinField>
            </div>
            <button type="submit" disabled={saveSettings.isPending} className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark disabled:opacity-60">
              Salvar
            </button>
          </form>
        )}
      </Panel>

      <Panel title="Categorias">
        <div className="divide-y divide-border/40">
          {categories.map((c) => (
            <div key={c.id} className="py-2.5 flex flex-wrap items-center gap-3">
              <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${c.kind === "receita" ? "bg-primary/10 text-primary" : "bg-red-50 text-red-700"}`}>
                {c.kind}
              </span>
              <input
                defaultValue={c.name}
                onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && catMut.mutate({ type: "rename", c, name: e.target.value.trim() })}
                className={`flex-1 min-w-[160px] bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 ${c.active ? "text-primary-dark" : "text-[var(--text-muted)] line-through"}`}
              />
              <span className="text-[11px] text-[var(--text-muted)]">{DRE_GROUP_LABEL[c.dre_group]}</span>
              {c.slug ? (
                <span className="text-[10px] text-[var(--text-muted)] w-16 text-right" title="Usada nos lançamentos automáticos">automática</span>
              ) : (
                <button type="button" onClick={() => catMut.mutate({ type: "toggle", c })} className="text-[10px] uppercase tracking-widest text-primary w-16 text-right">
                  {c.active ? "Ocultar" : "Reativar"}
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_130px_1fr_auto] gap-2 pt-4 items-end">
          <FinField label="Nova categoria">
            <input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="ex: Fotografia" className={finInputCls} />
          </FinField>
          <FinField label="Tipo">
            <select value={newCat.kind} onChange={(e) => { const k = e.target.value as FinKind; setNewCat({ ...newCat, kind: k, group: groupsFor(k)[0] }); }} className={finInputCls}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
          </FinField>
          <FinField label="Linha do DRE">
            <select value={newCat.group} onChange={(e) => setNewCat({ ...newCat, group: e.target.value as DreGroup })} className={finInputCls}>
              {groupsFor(newCat.kind).map((g) => <option key={g} value={g}>{DRE_GROUP_LABEL[g]}</option>)}
            </select>
          </FinField>
          <button type="button" onClick={() => catMut.mutate({ type: "add" })} className="bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark">
            Adicionar
          </button>
        </div>
      </Panel>

      <Panel title="O que entra sozinho">
        <ul className="text-sm text-primary-dark space-y-1.5 py-2 list-disc pl-5">
          <li><strong>Venda paga</strong> → conta a receber (PIX na hora; cartão na data em que a Pagar.me libera).</li>
          <li><strong>Conciliação Pagar.me</strong> (todo dia e no botão) → parcelas reais, datas e <strong>taxas</strong>.</li>
          <li><strong>Etiqueta comprada</strong> → despesa de frete. Não lance as recargas de saldo do Melhor Envio, pra não contar duas vezes.</li>
          <li><strong>Nota de fornecedor</strong> importada em <Link to="/admin/compras" className="text-primary underline">Entrada de mercadoria</Link> → contas a pagar.</li>
          <li><strong>Pedido pago cancelado</strong> → estorno.</li>
        </ul>
      </Panel>
    </div>
  );
}

// ================= UI =================
function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" }) {
  const color = tone === "bad" ? "text-red-700" : tone === "good" ? "text-primary" : "text-primary-dark";
  return (
    <div className="bg-white border border-border/20 rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
      <p className={`font-display text-2xl mt-1 ${color}`}>{value}</p>
      {hint && <p className="text-[10px] text-[var(--text-muted)] mt-1">{hint}</p>}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg text-primary-dark">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
