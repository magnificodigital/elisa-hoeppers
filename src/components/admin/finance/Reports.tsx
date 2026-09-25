import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  addDays,
  addMonths,
  brl,
  buildDre,
  getCmv,
  getFinSettings,
  listEntries,
  listOpenEntries,
  monthEnd,
  monthKey,
  monthLabel,
  monthStart,
  realizedUntil,
  today,
  type DreMonth,
  type FinCategory,
} from "@/lib/finance";

const GREEN = "#3E573F";
const RED = "#B91C1C";
const GOLD = "#B7791F";

// ================= FLUXO DE CAIXA =================
export function CashFlow() {
  const t = today();
  const cur = monthKey(t);
  const from = monthStart(addMonths(t, -5));
  const to = monthEnd(addMonths(t, 6));

  const { data } = useQuery({
    queryKey: ["fin", "cashflow", from, to],
    queryFn: async () => {
      const s = await getFinSettings();
      const [entries, open] = await Promise.all([listEntries(from, to), listOpenEntries()]);
      const before = from > s.openingDate ? await realizedUntil(s.openingDate, addDays(from, -1)) : { in: 0, out: 0 };
      return { s, entries, open, startBalance: s.openingCents + before.in - before.out };
    },
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const months = Array.from({ length: 12 }, (_, i) => monthKey(addMonths(from, i)));
    let balance = data.startBalance;
    return months.map((key) => {
      let rIn = 0, rOut = 0, fIn = 0, fOut = 0;
      for (const e of data.entries) {
        if (e.paid_at && monthKey(e.paid_at) === key && e.paid_at >= data.s.openingDate) {
          if (e.kind === "receita") rIn += e.amount_cents; else rOut += e.amount_cents;
        }
      }
      if (key >= cur) {
        for (const e of data.open) {
          const k = monthKey(e.due_date);
          // Vencidos em aberto contam no mês atual
          if (k === key || (key === cur && k < cur)) {
            if (e.kind === "receita") fIn += e.amount_cents; else fOut += e.amount_cents;
          }
        }
      }
      const start = balance;
      balance = start + rIn - rOut + fIn - fOut;
      return { key, label: monthLabel(key), rIn, rOut, fIn, fOut, start, end: balance, past: key < cur };
    });
  }, [data, from, cur]);

  const chart = rows.map((r) => ({
    mes: r.label,
    Entradas: (r.rIn + r.fIn) / 100,
    Saídas: (r.rOut + r.fOut) / 100,
    Saldo: r.end / 100,
  }));
  const negative = rows.find((r) => !r.past && r.end < 0);

  return (
    <div className="space-y-6">
      {negative && (
        <div className="flex gap-2 items-start bg-red-50 text-red-800 rounded-lg p-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          Pelas contas lançadas, o caixa fica negativo em {monthLabel(negative.key, false)} ({brl(negative.end)}).
        </div>
      )}
      <div className="bg-white border border-border/20 rounded-lg p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
            <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Entradas" fill={GREEN} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Saídas" fill={RED} radius={[3, 3, 0, 0]} />
            <Line dataKey="Saldo" stroke={GOLD} strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-border/20 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-muted)] border-b border-border">
              <th className="p-3">Mês</th>
              <th className="p-3 text-right">Saldo inicial</th>
              <th className="p-3 text-right">Entradas</th>
              <th className="p-3 text-right">Saídas</th>
              <th className="p-3 text-right">Saldo final</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={`border-b border-border/40 last:border-0 ${r.key === cur ? "bg-sand/50" : ""}`}>
                <td className="p-3 text-primary-dark">
                  {r.label}
                  {r.key === cur && <span className="ml-2 text-[9px] uppercase tracking-widest text-primary">atual</span>}
                  {r.key > cur && <span className="ml-2 text-[9px] uppercase tracking-widest text-[var(--text-muted)]">previsto</span>}
                </td>
                <td className="p-3 text-right text-[var(--text-muted)]">{brl(r.start)}</td>
                <td className="p-3 text-right text-primary">
                  {brl(r.rIn + r.fIn)}
                  {r.fIn > 0 && r.rIn > 0 && <span className="block text-[10px] text-[var(--text-muted)]">{brl(r.fIn)} a receber</span>}
                </td>
                <td className="p-3 text-right text-red-700">
                  {brl(r.rOut + r.fOut)}
                  {r.fOut > 0 && r.rOut > 0 && <span className="block text-[10px] text-[var(--text-muted)]">{brl(r.fOut)} a pagar</span>}
                </td>
                <td className={`p-3 text-right font-medium ${r.end < 0 ? "text-red-700" : "text-primary-dark"}`}>{brl(r.end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        Meses passados mostram o que foi pago e recebido de fato. O mês atual e os próximos somam também o que está em aberto
        (contas vencidas entram no mês atual). Vendas no cartão entram na data em que a Pagar.me libera o dinheiro.
      </p>
    </div>
  );
}

// ================= DRE =================
export function Dre({ categories }: { categories: FinCategory[] }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const { data } = useQuery({
    queryKey: ["fin", "dre", year],
    queryFn: async () => {
      const [entries, cmv] = await Promise.all([listEntries(from, to), getCmv(from, to)]);
      return { entries, cmv };
    },
  });

  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const dre = data ? buildDre(months, data.entries, categories, data.cmv) : [];
  const total = dre.reduce<DreMonth | null>((acc, m) => {
    if (!acc) return { ...m, key: "total", porCategoria: new Map(m.porCategoria) };
    const s = { ...acc };
    for (const k of Object.keys(m) as (keyof DreMonth)[]) {
      if (typeof m[k] === "number") (s as any)[k] = (acc as any)[k] + (m as any)[k];
    }
    for (const [c, v] of m.porCategoria) s.porCategoria.set(c, (s.porCategoria.get(c) ?? 0) + v);
    return s;
  }, null);
  const cols = total ? [...dre, total] : [];
  const missing = dre.reduce((a, m) => a + m.cmvMissing, 0);
  const opCats = categories.filter((c) => c.dre_group === "despesas_operacionais");

  const line = (label: string, get: (m: DreMonth) => number, opts: { strong?: boolean; sign?: "-" | "+"; onClick?: () => void; caret?: boolean } = {}) => (
    <tr className={`border-b border-border/40 ${opts.strong ? "bg-sand/50 font-medium" : ""}`}>
      <td className={`p-2 pr-4 sticky left-0 whitespace-nowrap ${opts.strong ? "bg-[#f6f1ea] text-primary-dark" : "bg-white text-primary-dark"}`}>
        {opts.onClick ? (
          <button type="button" onClick={opts.onClick} className="inline-flex items-center gap-1">
            {opts.caret ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {opts.sign && `(${opts.sign}) `}{label}
          </button>
        ) : (
          <>{opts.sign && `(${opts.sign}) `}{label}</>
        )}
      </td>
      {cols.map((m) => {
        const v = get(m);
        return (
          <td key={m.key} className={`p-2 text-right whitespace-nowrap ${m.key === "total" ? "bg-sand/40" : ""} ${opts.strong && v < 0 ? "text-red-700" : ""} ${v === 0 ? "text-[var(--text-muted)]" : ""}`}>
            {v === 0 ? "—" : brl(v)}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setYear(year - 1)} className="p-1.5 rounded-full hover:bg-sand"><ChevronLeft className="w-4 h-4" /></button>
        <span className="font-display text-xl text-primary-dark">{year}</span>
        <button type="button" onClick={() => setYear(year + 1)} className="p-1.5 rounded-full hover:bg-sand"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {missing > 0 && (
        <div className="flex gap-2 items-start bg-peach/40 text-primary-dark rounded-lg p-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {missing} item(ns) vendido(s) sem custo cadastrado, então o custo das mercadorias (CMV) está incompleto. Preencha o custo em{" "}
            <Link to="/admin/produtos" className="underline">Produtos</Link> ou importe as notas em{" "}
            <Link to="/admin/compras" className="underline">Entrada de mercadoria</Link>.
          </span>
        </div>
      )}

      <div className="bg-white border border-border/20 rounded-lg overflow-x-auto">
        <table className="text-sm min-w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] border-b border-border">
              <th className="p-2 pr-4 text-left sticky left-0 bg-white">&nbsp;</th>
              {cols.map((m) => (
                <th key={m.key} className={`p-2 text-right whitespace-nowrap ${m.key === "total" ? "bg-sand/40" : ""}`}>
                  {m.key === "total" ? "Total" : monthLabel(m.key).split("/")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {line("Receita bruta de vendas", (m) => m.receitaBruta)}
            {line("Estornos e devoluções", (m) => -m.deducoes, { sign: "-" })}
            {line("Receita líquida", (m) => m.receitaLiquida, { strong: true })}
            {line("Custo das mercadorias vendidas (CMV)", (m) => -m.cmv, { sign: "-" })}
            {line("Lucro bruto", (m) => m.lucroBruto, { strong: true })}
            {line("Taxas de pagamento", (m) => -m.taxas, { sign: "-" })}
            {line("Frete de envio", (m) => -m.frete, { sign: "-" })}
            {line("Despesas operacionais", (m) => -m.despesasOperacionais, { sign: "-", onClick: () => setOpen(!open), caret: open })}
            {open && opCats.map((c) => (
              <tr key={c.id} className="border-b border-border/40 text-[var(--text-muted)]">
                <td className="p-2 pl-9 pr-4 sticky left-0 bg-white whitespace-nowrap">{c.name}</td>
                {cols.map((m) => {
                  const v = m.porCategoria.get(c.id) ?? 0;
                  return <td key={m.key} className={`p-2 text-right whitespace-nowrap ${m.key === "total" ? "bg-sand/40" : ""}`}>{v ? brl(-v) : "—"}</td>;
                })}
              </tr>
            ))}
            {line("Impostos", (m) => -m.impostos, { sign: "-" })}
            {line("Outras receitas", (m) => m.outrasReceitas, { sign: "+" })}
            {line("Outras despesas", (m) => -m.outrasDespesas, { sign: "-" })}
            {line("Resultado (lucro/prejuízo)", (m) => m.resultado, { strong: true })}
            <tr>
              <td className="p-2 pr-4 sticky left-0 bg-white text-[var(--text-muted)] whitespace-nowrap">Margem</td>
              {cols.map((m) => (
                <td key={m.key} className={`p-2 text-right text-[var(--text-muted)] ${m.key === "total" ? "bg-sand/40" : ""}`}>
                  {m.receitaLiquida > 0 ? `${Math.round((m.resultado / m.receitaLiquida) * 100)}%` : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        O DRE usa o mês de referência de cada lançamento (a venda entra no mês em que foi paga, mesmo que o cartão libere
        depois). Compra de mercadoria não entra aqui: ela vai para o estoque e vira custo (CMV) quando o produto é vendido.
      </p>
    </div>
  );
}
