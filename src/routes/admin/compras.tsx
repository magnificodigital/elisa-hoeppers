import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileInput, Upload, AlertTriangle, ChevronDown, ChevronRight, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { listAllProductsForAdmin, type Product } from "@/lib/shop";
import { parseNfeXml, similarity, norm, type NfeData } from "@/lib/nfe-xml";
import { brl, fmtDate, today } from "@/lib/finance";
import { formatBRLInput } from "@/lib/currency";

export const Route = createFileRoute("/admin/compras")({
  head: () => ({ meta: [{ title: "Admin — Entrada de mercadoria" }] }),
  component: PurchasesPage,
});

const STORE_CNPJ = "19224761000155";

const inputCls =
  "w-full rounded-lg border border-[#DBCCBF] px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-primary bg-white";

type Row = {
  code: string;
  ean: string | null;
  description: string;
  ncm: string | null;
  unit: string | null;
  qty: number;
  totalCents: number;
  landedCents: number;
  productId: string; // "" = não entra no estoque
  multiplier: string;
  suggested: "memoria" | "codigo" | "nome" | null;
};

type Payable = { due_date: string; amount_cents: number; installment: string };

function PurchasesPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nfe, setNfe] = useState<NfeData | null>(null);
  const [xml, setXml] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [dragging, setDragging] = useState(false);

  const { data: products } = useQuery({ queryKey: ["admin-products"], queryFn: listAllProductsForAdmin });

  const { data: purchases } = useQuery({
    queryKey: ["admin-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, number, series, issued_at, total_cents, created_at, supplier:suppliers(name, cnpj), items:purchase_items(description, qty, units_in, unit_cost_cents, product_id)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  async function loadFile(file: File) {
    try {
      const content = await file.text();
      const data = parseNfeXml(content);
      const prods = products ?? (await listAllProductsForAdmin());

      // Vínculos lembrados deste fornecedor
      let memory = new Map<string, { product_id: string; multiplier: number }>();
      if (data.supplier.cnpj) {
        const { data: sup } = await supabase.from("suppliers").select("id").eq("cnpj", data.supplier.cnpj).maybeSingle();
        if (sup) {
          const { data: maps } = await supabase
            .from("supplier_product_map")
            .select("supplier_code, product_id, multiplier")
            .eq("supplier_id", sup.id);
          memory = new Map((maps ?? []).map((m) => [m.supplier_code, { product_id: m.product_id, multiplier: Number(m.multiplier) }]));
        }
      }

      setRows(
        data.items.map((it) => {
          const mem = memory.get(it.code);
          let productId = mem?.product_id ?? "";
          let suggested: Row["suggested"] = mem ? "memoria" : null;
          if (!productId) {
            const bySku = prods.find(
              (p) => p.sku && (norm(p.sku) === norm(it.code) || (it.ean && norm(p.sku) === norm(it.ean))),
            );
            if (bySku) { productId = bySku.id; suggested = "codigo"; }
          }
          if (!productId) {
            let best: { p: Product; s: number } | null = null;
            for (const p of prods) {
              const s = similarity(it.description, p.name);
              if (s >= 0.6 && (!best || s > best.s)) best = { p, s };
            }
            if (best) { productId = best.p.id; suggested = "nome"; }
          }
          return {
            code: it.code, ean: it.ean, description: it.description, ncm: it.ncm, unit: it.unit, qty: it.qty,
            totalCents: it.totalCents, landedCents: it.landedCents, productId,
            multiplier: String(mem?.multiplier ?? 1), suggested,
          };
        }),
      );
      setPayables(
        data.dups.length
          ? data.dups.map((d, i) => ({ due_date: d.dueDate, amount_cents: d.amountCents, installment: `${i + 1}/${data.dups.length}` }))
          : [{ due_date: data.issuedAt ?? today(), amount_cents: data.totalCents, installment: "" }],
      );
      setAlreadyPaid(false);
      setNfe(data);
      setXml(content);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const payableSum = payables.reduce((a, p) => a + (p.amount_cents || 0), 0);

  const importIt = useMutation({
    mutationFn: async () => {
      if (!nfe) return;
      const items = rows.map((r) => {
        const mult = Math.max(0.0001, parseFloat(r.multiplier.replace(",", ".")) || 1);
        const units = Math.round(r.qty * mult);
        return {
          product_id: r.productId || null,
          supplier_code: r.code,
          ean: r.ean,
          description: r.description,
          ncm: r.ncm,
          unit: r.unit,
          qty: r.qty,
          multiplier: mult,
          unit_cost_cents: units > 0 ? Math.round(r.landedCents / units) : null,
          total_cents: r.totalCents,
        };
      });
      const { error } = await supabase.rpc("admin_import_purchase", {
        p: {
          supplier: nfe.supplier,
          nfe_key: nfe.key,
          number: nfe.number,
          series: nfe.series,
          issued_at: nfe.issuedAt,
          products_cents: nfe.productsCents,
          freight_cents: nfe.freightCents,
          discount_cents: nfe.discountCents,
          other_cents: nfe.otherCents,
          total_cents: nfe.totalCents,
          xml,
          items,
          payables: payables.filter((p) => p.amount_cents > 0 && p.due_date),
          paid: alreadyPaid,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const n = rows.filter((r) => r.productId).length;
      toast.success(`Nota ${nfe?.number} importada: ${n} produto(s) com entrada no estoque e ${payables.length} conta(s) a pagar.`);
      setNfe(null);
      setRows([]);
      qc.invalidateQueries({ queryKey: ["admin-purchases"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-stock"] });
      qc.invalidateQueries({ queryKey: ["fin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const productOptions = useMemo(
    () => [...(products ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [products],
  );

  return (
    <section className="py-10 md:py-14 bg-background min-h-[70vh]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-1">
          <FileInput className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl text-primary-dark">Entrada de mercadoria</h1>
        </div>
        <p className="text-sm text-primary-dark/60 mb-8">
          Envie o XML da nota do fornecedor. A loja dá entrada no estoque, atualiza o custo médio dos produtos
          e cria as contas a pagar no <Link to="/admin/financeiro" className="text-primary underline">Financeiro</Link>.
          Da próxima vez, os produtos desse fornecedor já vêm vinculados.
        </p>

        {!nfe && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) loadFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition mb-10 ${
              dragging ? "border-primary bg-primary/5" : "border-[#DBCCBF] bg-white hover:border-primary"
            }`}
          >
            <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-primary-dark font-medium">Arraste o XML da nota aqui ou clique para escolher</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              O fornecedor manda o XML por e-mail junto com a nota. Também dá pra baixar no portal da SEFAZ pela chave.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xml,text/xml,application/xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadFile(f);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {nfe && (
          <div className="bg-white border border-border/20 rounded-lg p-5 md:p-6 mb-10 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  NF {nfe.number}{nfe.series && ` · série ${nfe.series}`} · {fmtDate(nfe.issuedAt)}
                </p>
                <h2 className="font-display text-2xl text-primary-dark">{nfe.supplier.name}</h2>
                <p className="text-xs text-[var(--text-muted)]">CNPJ {nfe.supplier.cnpj ?? "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Total da nota</p>
                <p className="font-display text-2xl text-primary-dark">{brl(nfe.totalCents)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Produtos {brl(nfe.productsCents)}
                  {nfe.freightCents > 0 && ` · frete ${brl(nfe.freightCents)}`}
                  {nfe.otherCents > 0 && ` · impostos/outros ${brl(nfe.otherCents)}`}
                  {nfe.discountCents > 0 && ` · desconto ${brl(nfe.discountCents)}`}
                </p>
              </div>
            </div>

            {nfe.recipientDoc && nfe.recipientDoc !== STORE_CNPJ && (
              <div className="flex gap-2 items-start bg-peach/40 text-primary-dark rounded-lg p-3 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                O destinatário desta nota ({nfe.recipientDoc}) não é o CNPJ da BODYOGA. Confira se é a nota certa.
              </div>
            )}

            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-primary-dark mb-2">Itens da nota</h3>
              <div className="space-y-3">
                {rows.map((r, i) => {
                  const mult = Math.max(0.0001, parseFloat(r.multiplier.replace(",", ".")) || 1);
                  const units = Math.round(r.qty * mult);
                  const unitCost = units > 0 ? Math.round(r.landedCents / units) : 0;
                  const set = (patch: Partial<Row>) =>
                    setRows((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                  return (
                    <div key={i} className="border border-border/40 rounded-lg p-3">
                      <div className="flex flex-wrap justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm text-primary-dark font-medium break-words">{r.description}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            Cód. {r.code || "—"}{r.ean && ` · EAN ${r.ean}`} · {r.qty.toLocaleString("pt-BR")} {r.unit ?? ""} · {brl(r.totalCents)}
                          </p>
                        </div>
                        {r.suggested && r.productId && (
                          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary h-fit">
                            {r.suggested === "memoria" ? "Vínculo lembrado" : r.suggested === "codigo" ? "Pelo código" : "Sugestão pelo nome — confira"}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_180px] gap-2 items-end">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">Produto da loja</label>
                          <select value={r.productId} onChange={(e) => set({ productId: e.target.value, suggested: null })} className={inputCls}>
                            <option value="">Não entra no estoque (embalagem, material…)</option>
                            {productOptions.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1" title="Ex.: a nota diz 1 CX com 12 unidades → 12">
                            Unid. por item
                          </label>
                          <input value={r.multiplier} onChange={(e) => set({ multiplier: e.target.value })} inputMode="decimal" className={inputCls} disabled={!r.productId} />
                        </div>
                        <div className="text-sm text-primary-dark md:text-right">
                          {r.productId ? (
                            <>
                              <strong>+{units} un.</strong> no estoque
                              <br />
                              <span className="text-[11px] text-[var(--text-muted)]">custo {brl(unitCost)}/un (com frete e impostos)</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">Só entra no financeiro</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-primary-dark mb-2">
                Pagamento ao fornecedor {nfe.dups.length > 0 && "(duplicatas da nota)"}
              </h3>
              <div className="space-y-2">
                {payables.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <input type="date" value={p.due_date} onChange={(e) => setPayables((prev) => prev.map((x, j) => (j === i ? { ...x, due_date: e.target.value } : x)))} className={inputCls} />
                    <input
                      inputMode="decimal"
                      value={formatBRLInput(String(p.amount_cents)).display}
                      onChange={(e) => {
                        const c = formatBRLInput(e.target.value).cents;
                        setPayables((prev) => prev.map((x, j) => (j === i ? { ...x, amount_cents: c } : x)));
                      }}
                      className={inputCls}
                    />
                    <button type="button" onClick={() => setPayables((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-red-700" title="Remover parcela">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <button
                    type="button"
                    onClick={() => setPayables((prev) => [...prev, { due_date: today(), amount_cents: 0, installment: "" }])}
                    className="text-xs uppercase tracking-widest text-primary inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Parcela
                  </button>
                  <p className={`text-xs ${payableSum !== nfe.totalCents ? "text-[#B7791F]" : "text-[var(--text-muted)]"}`}>
                    Soma das parcelas: {brl(payableSum)}
                    {payableSum !== nfe.totalCents && ` (nota: ${brl(nfe.totalCents)})`}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-primary-dark cursor-pointer">
                  <input type="checkbox" checked={alreadyPaid} onChange={(e) => setAlreadyPaid(e.target.checked)} />
                  Já está paga (paguei à vista)
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-border pt-4">
              <button type="button" onClick={() => { setNfe(null); setRows([]); }} className="px-5 py-2 rounded-full text-xs uppercase tracking-widest text-primary-dark">
                Cancelar
              </button>
              <button
                type="button"
                disabled={importIt.isPending}
                onClick={() => importIt.mutate()}
                className="bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark transition disabled:opacity-60"
              >
                {importIt.isPending ? "Importando…" : "Confirmar entrada"}
              </button>
            </div>
          </div>
        )}

        <h2 className="font-display text-xl text-primary-dark mb-3">Notas importadas</h2>
        {(purchases ?? []).length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhuma nota importada ainda.</p>
        ) : (
          <div className="space-y-2">
            {(purchases ?? []).map((p) => <PurchaseRow key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function PurchaseRow({ p }: { p: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-border/20 rounded-lg">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left">
        {open ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-primary" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-primary-dark font-medium truncate">{p.supplier?.name ?? "Fornecedor"} — NF {p.number}</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {fmtDate(p.issued_at)} · {p.items?.length ?? 0} item(ns)
          </p>
        </div>
        <p className="text-sm text-primary-dark">{brl(p.total_cents)}</p>
      </button>
      {open && (
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-muted)] border-b border-border">
                <th className="py-2 pr-3">Item</th>
                <th className="py-2 pr-3 text-right">Entrou</th>
                <th className="py-2 text-right">Custo/un</th>
              </tr>
            </thead>
            <tbody>
              {(p.items ?? []).map((it: any, i: number) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="py-2 pr-3">{it.description}</td>
                  <td className="py-2 pr-3 text-right">{it.product_id ? `${it.units_in} un.` : "—"}</td>
                  <td className="py-2 text-right">{it.unit_cost_cents ? brl(it.unit_cost_cents) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
