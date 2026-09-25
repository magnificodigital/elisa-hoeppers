import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Boxes, ImageOff, History, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { listAllProductsForAdmin, firstImage, formatPriceBRL, type Product } from "@/lib/shop";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({ meta: [{ title: "Admin — Estoque" }] }),
  component: StockPage,
});

type Mode = "entrada" | "saida" | "inventario";
type Filter = "todos" | "baixo" | "esgotado" | "sem-controle";

type Movement = {
  id: string;
  product_id: string;
  delta: number;
  balance_after: number | null;
  reason: string;
  note: string | null;
  created_at: string;
};

const REASON: Record<string, string> = {
  venda: "Venda",
  cancelamento: "Pedido cancelado",
  entrada: "Entrada",
  saida: "Saída",
  inventario: "Contagem",
  ajuste: "Ajuste",
};

const MODE_LABEL: Record<Mode, string> = {
  entrada: "Entrada (chegou mercadoria)",
  saida: "Saída (perda, brinde, uso)",
  inventario: "Contagem (quantidade real)",
};

const inputCls =
  "w-full rounded-lg border border-[#DBCCBF] px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-primary";

function isLow(p: Product) {
  return p.stock_qty != null && p.stock_qty > 0 && p.stock_qty <= (p.low_stock_threshold ?? 2);
}

function StockPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("todos");
  const [editing, setEditing] = useState<{ product: Product; mode: Mode } | null>(null);
  const [historyOf, setHistoryOf] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: listAllProductsForAdmin,
  });

  const { data: movements } = useQuery({
    queryKey: ["admin-stock", "movements", historyOf?.id ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("stock_movements")
        .select("id, product_id, delta, balance_after, reason, note, created_at")
        .order("created_at", { ascending: false })
        .limit(historyOf ? 200 : 30);
      if (historyOf) q = q.eq("product_id", historyOf.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Movement[];
    },
  });

  const all = products ?? [];
  const controlled = all.filter((p) => p.stock_qty != null);
  const low = controlled.filter(isLow);
  const out = all.filter((p) => !p.in_stock);
  const costValue = controlled.reduce((acc, p) => acc + Math.max(0, p.stock_qty ?? 0) * (p.cost_cents ?? 0), 0);
  const saleValue = controlled.reduce((acc, p) => acc + Math.max(0, p.stock_qty ?? 0) * p.price_cents, 0);
  const missingCost = controlled.some((p) => !p.cost_cents);

  const list = useMemo(() => {
    if (filter === "baixo") return low;
    if (filter === "esgotado") return out;
    if (filter === "sem-controle") return all.filter((p) => p.stock_qty == null);
    return all;
  }, [filter, all, low, out]);

  const names = useMemo(() => new Map(all.map((p) => [p.id, p.name])), [all]);

  return (
    <section className="py-10 md:py-14 bg-background min-h-[70vh]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-1">
          <Boxes className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl text-primary-dark">Estoque</h1>
        </div>
        <p className="text-sm text-primary-dark/60 mb-8">
          A cada venda paga a loja dá baixa sozinha, e devolve se o pedido for cancelado. Aqui você registra
          a chegada de mercadoria, perdas e a contagem real. Você recebe um e-mail quando um produto fica com
          estoque baixo.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat label="Com quantidade controlada" value={`${controlled.length} de ${all.length}`} />
          <Stat label="Estoque baixo" value={String(low.length)} tone={low.length ? "warn" : undefined} />
          <Stat label="Esgotados" value={String(out.length)} tone={out.length ? "bad" : undefined} />
          <Stat
            label={missingCost ? "Valor a preço de venda" : "Valor em estoque (custo)"}
            value={formatPriceBRL(missingCost ? saleValue : costValue)}
            hint={missingCost ? "Preencha o custo nos produtos para ver o valor a custo." : `A preço de venda: ${formatPriceBRL(saleValue)}`}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ["todos", `Todos (${all.length})`],
            ["baixo", `Estoque baixo (${low.length})`],
            ["esgotado", `Esgotados (${out.length})`],
            ["sem-controle", `Sem quantidade (${all.length - controlled.length})`],
          ] as [Filter, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest border transition ${
                filter === id ? "bg-primary text-white border-primary" : "border-border text-primary-dark hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

        <div className="space-y-3 mb-10">
          {list.map((p) => (
            <div key={p.id} className="bg-white border border-border/20 rounded-lg p-4 flex flex-wrap md:flex-nowrap items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-sand border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {firstImage(p) ? (
                  <img src={firstImage(p)!} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="w-5 h-5 text-[var(--text-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-[160px]">
                <Link to="/admin/produtos/$id" params={{ id: p.id }} className="font-medium text-primary-dark hover:text-primary break-words">
                  {p.name}
                </Link>
                <p className="text-[11px] text-[var(--text-muted)]">
                  SKU: {p.sku || "—"}
                  {p.stock_qty != null && ` · avisa com ${p.low_stock_threshold ?? 2} un.`}
                </p>
              </div>
              <div className="text-center w-24 shrink-0">
                {p.stock_qty == null ? (
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                    {p.in_stock ? "Disponível" : "Esgotado"}
                    <br />
                    sem quantidade
                  </p>
                ) : (
                  <>
                    <p className={`text-2xl font-display ${p.stock_qty <= 0 ? "text-red-700" : isLow(p) ? "text-[#B7791F]" : "text-primary-dark"}`}>
                      {p.stock_qty}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">unidades</p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {p.stock_qty == null ? (
                  <ActionBtn onClick={() => setEditing({ product: p, mode: "inventario" })} primary>
                    Controlar quantidade
                  </ActionBtn>
                ) : (
                  <>
                    <ActionBtn onClick={() => setEditing({ product: p, mode: "entrada" })} primary>+ Entrada</ActionBtn>
                    <ActionBtn onClick={() => setEditing({ product: p, mode: "saida" })}>− Saída</ActionBtn>
                    <ActionBtn onClick={() => setEditing({ product: p, mode: "inventario" })}>Contagem</ActionBtn>
                    <ActionBtn onClick={() => setHistoryOf(p)} title="Histórico">
                      <History className="w-3.5 h-3.5" />
                    </ActionBtn>
                  </>
                )}
              </div>
            </div>
          ))}
          {!isLoading && list.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Nenhum produto neste filtro.</p>
          )}
        </div>

        <div className="bg-white border border-border/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-primary-dark">
              {historyOf ? `Histórico — ${historyOf.name}` : "Últimas movimentações"}
            </h2>
            {historyOf && (
              <button onClick={() => setHistoryOf(null)} className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Ver todas
              </button>
            )}
          </div>
          {(movements ?? []).length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhuma movimentação ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-muted)] border-b border-border">
                    <th className="py-2 pr-3">Data</th>
                    {!historyOf && <th className="py-2 pr-3">Produto</th>}
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3 text-right">Qtd.</th>
                    <th className="py-2 pr-3 text-right">Saldo</th>
                    <th className="py-2">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {(movements ?? []).map((m) => (
                    <tr key={m.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap text-[var(--text-muted)]">
                        {new Date(m.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      {!historyOf && <td className="py-2 pr-3 text-primary-dark">{names.get(m.product_id) ?? "—"}</td>}
                      <td className="py-2 pr-3">{REASON[m.reason] ?? m.reason}</td>
                      <td className={`py-2 pr-3 text-right font-medium ${m.delta < 0 ? "text-red-700" : "text-primary"}`}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </td>
                      <td className="py-2 pr-3 text-right">{m.balance_after ?? "—"}</td>
                      <td className="py-2 text-[var(--text-muted)]">{m.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <AdjustDialog
          product={editing.product}
          mode={editing.mode}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-products"] });
            qc.invalidateQueries({ queryKey: ["admin-stock"] });
          }}
        />
      )}
    </section>
  );
}

function AdjustDialog({ product, mode: initialMode, onClose, onDone }: {
  product: Product;
  mode: Mode;
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [qty, setQty] = useState<string>(initialMode === "inventario" && product.stock_qty != null ? String(product.stock_qty) : "");
  const [note, setNote] = useState("");
  const current = product.stock_qty;
  const n = Math.max(0, parseInt(qty) || 0);
  const result = mode === "entrada" ? (current ?? 0) + n : mode === "saida" ? (current ?? 0) - n : n;

  const save = useMutation({
    mutationFn: async () => {
      if (qty.trim() === "") throw new Error("Informe a quantidade.");
      const { error } = await supabase.rpc("admin_stock_adjust", {
        p_product_id: product.id,
        p_mode: mode,
        p_qty: n,
        p_note: note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Estoque de ${product.name}: ${result} un.`);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className="bg-white rounded-xl w-full max-w-md p-6 space-y-4"
      >
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Estoque</p>
          <h3 className="font-display text-xl text-primary-dark">{product.name}</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Atual: {current == null ? "sem quantidade controlada" : `${current} un.`}
          </p>
        </div>

        {current != null && (
          <div className="flex flex-col gap-1.5">
            {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm cursor-pointer text-primary-dark">
                <input type="radio" checked={mode === m} onChange={() => { setMode(m); setQty(m === "inventario" ? String(current) : ""); }} />
                {MODE_LABEL[m]}
              </label>
            ))}
          </div>
        )}

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
            {mode === "inventario" ? "Quantidade que você tem agora" : "Quantidade"}
          </label>
          <input autoFocus type="number" min="0" step="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">Observação (opcional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === "entrada" ? "ex: NF 1234 do fornecedor" : mode === "saida" ? "ex: frasco quebrado" : "ex: contagem mensal"}
            className={inputCls}
          />
        </div>

        {qty.trim() !== "" && (
          <p className={`text-sm ${result < 0 ? "text-red-700" : "text-primary-dark"}`}>
            Estoque vai ficar em <strong>{result} un.</strong>
            {result <= 0 && " — o produto aparece como esgotado na loja."}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-full text-xs uppercase tracking-widest text-primary-dark">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark transition disabled:opacity-60"
          >
            {save.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ActionBtn({ children, onClick, primary, title }: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-semibold transition ${
        primary ? "bg-primary text-white hover:bg-primary-dark" : "border border-border text-primary-dark hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warn" | "bad" }) {
  const color = tone === "bad" ? "text-red-700" : tone === "warn" ? "text-[#B7791F]" : "text-primary-dark";
  return (
    <div className="bg-white border border-border/20 rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
      <p className={`font-display text-2xl mt-1 ${color}`}>{value}</p>
      {hint && <p className="text-[10px] text-[var(--text-muted)] mt-1">{hint}</p>}
    </div>
  );
}
