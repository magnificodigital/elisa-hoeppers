import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronLeft, Link2, RefreshCw, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { listAllProductsForAdmin, formatPriceBRL } from "@/lib/shop";

export const Route = createFileRoute("/admin/configuracoes/awise")({
  head: () => ({ meta: [{ title: "Admin — Awise" }] }),
  component: AwisePage,
});

type Options = {
  payment_configurations: { id: string; name: string }[];
  products: { id: string; name: string; code: string; stock: number; price: number; cost: number; ncm: string | null }[];
  webhook: { id: string; url: string; events: string[] } | null;
};

const TOGGLES: { key: string; label: string; desc: string }[] = [
  { key: "awise_push_orders", label: "Enviar pedidos pagos para a Awise", desc: "Cada venda paga no site vira um pedido faturado na Awise: baixa o estoque e entra no financeiro dela." },
  { key: "awise_sync_stock", label: "Estoque vem da Awise", desc: "Ligue depois que TODOS os produtos estiverem cadastrados e contados na Awise. Produto com estoque 0 lá fica esgotado no site." },
  { key: "awise_emit_nfe", label: "Emitir NF-e pela Awise", desc: "Ligue depois que os dados fiscais estiverem completos na Awise (certificado, NCM, impostos). Desliga a emissão pela Base." },
  { key: "awise_sync_price", label: "Preço vem da Awise", desc: "O preço de venda do site passa a seguir o da Awise." },
  { key: "awise_create_missing", label: "Criar no site os produtos novos da Awise", desc: "Aparecem como rascunho, pra você completar fotos e descrição antes de publicar." },
];

const card = "bg-white rounded-xl p-6 shadow-none border border-border/20";
const inputCls =
  "w-full rounded-lg border border-[#DBCCBF] px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-primary bg-white";

async function call<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("awise", { body });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

function AwisePage() {
  const qc = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: loaded } = useQuery({
    queryKey: ["awise", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value").eq("category", "awise");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""])) as Record<string, string>;
    },
  });
  useEffect(() => { if (loaded) setSettings(loaded); }, [loaded]);

  const { data: opts, error: optsError, isLoading: optsLoading } = useQuery({
    queryKey: ["awise", "options"],
    queryFn: () => call<Options>({ action: "options" }),
    retry: false,
  });
  const { data: products } = useQuery({ queryKey: ["admin-products"], queryFn: listAllProductsForAdmin });

  const saveSetting = async (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
    const rows = [{ key, value, category: "awise", is_secret: false }];
    // NF-e pela Awise desliga a emissão automática pela Base (evita nota em dobro).
    if (key === "awise_emit_nfe" && value === "true") rows.push({ key: "base_auto_emit", value: "false", category: "base", is_secret: false });
    const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["awise", "settings"] });
  };

  const sync = useMutation({
    mutationFn: () => call({ action: "sync_products" }),
    onSuccess: (d: any) => {
      toast.success(`Sincronizado: ${d.report.filter((r: any) => r.site).length} produto(s) vinculados.`);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["awise"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const webhook = useMutation({
    mutationFn: () => call({ action: "register_webhook" }),
    onSuccess: () => { toast.success("Avisos automáticos da Awise ativados."); qc.invalidateQueries({ queryKey: ["awise", "options"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const link = useMutation({
    mutationFn: async ({ productId, awiseId }: { productId: string; awiseId: string | null }) => {
      const { error } = await supabase.from("products").update({ awise_product_id: awiseId }).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("Vínculo salvo."); },
    onError: (e: Error) => toast.error(/unique/i.test(e.message) ? "Esse produto da Awise já está vinculado a outro produto do site." : e.message),
  });

  const awById = new Map((opts?.products ?? []).map((p) => [p.id, p]));
  const unlinked = (products ?? []).filter((p) => p.is_active && !(p as any).awise_product_id);
  const payments = opts?.payment_configurations ?? [];
  const missingPayment = !settings.awise_payment_card_id || !settings.awise_payment_pix_id;

  return (
    <section className="py-12 md:py-16 bg-background min-h-[70vh]">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <Link to="/admin/configuracoes/integracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition">
          <ChevronLeft size={16} /> Voltar
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Warehouse className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl text-primary-dark">Awise</h1>
          </div>
          <p className="text-sm text-primary-dark/60">
            A Awise é o sistema de gestão da loja: estoque, financeiro, nota fiscal e cashback. O site continua sendo a
            vitrine e manda cada venda paga pra lá.
          </p>
        </div>

        {/* Conexão */}
        <div className={card}>
          {optsLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Conectando à Awise…</p>
          ) : optsError ? (
            <p className="text-sm text-red-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {(optsError as Error).message}</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-primary-dark flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Conectado · {opts?.products.length ?? 0} produto(s) na Awise
                {settings.awise_last_sync && (
                  <span className="text-[var(--text-muted)]"> · última sincronização {new Date(settings.awise_last_sync).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                )}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => sync.mutate()} disabled={sync.isPending}
                  className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-semibold hover:bg-primary-dark disabled:opacity-60">
                  <RefreshCw className={`w-3.5 h-3.5 ${sync.isPending ? "animate-spin" : ""}`} /> Sincronizar agora
                </button>
                {!opts?.webhook && (
                  <button type="button" onClick={() => webhook.mutate()} disabled={webhook.isPending}
                    title="A Awise passa a avisar o site na hora quando estoque, preço ou nota mudarem"
                    className="inline-flex items-center gap-1.5 border border-primary text-primary px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-semibold hover:bg-primary/5 disabled:opacity-60">
                    Ativar avisos automáticos
                  </button>
                )}
              </div>
            </div>
          )}
          {opts?.webhook && <p className="text-[11px] text-[var(--text-muted)] mt-2">Avisos automáticos ativos (estoque, preço, produtos e nota fiscal).</p>}
        </div>

        {/* Formas de pagamento */}
        <div className={card}>
          <h2 className="font-display text-xl text-primary-dark mb-1">Como as vendas entram no financeiro da Awise</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Escolha a forma de pagamento da Awise usada para cada tipo de venda do site.
          </p>
          {missingPayment && (
            <div className="flex gap-2 items-start bg-peach/40 text-primary-dark rounded-lg p-3 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Sem isso os pedidos não vão para a Awise. Se não aparecer uma opção de cartão e de PIX, crie na Awise em
                <strong> Configurações → Formas de pagamento</strong>: "Pagar.me – Cartão (loja online)" e "Pagar.me – PIX
                (loja online)", marcadas para <strong>venda</strong>, conta <strong>Banco</strong>. Depois recarregue esta página.
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([["awise_payment_card_id", "Vendas no cartão"], ["awise_payment_pix_id", "Vendas no PIX"]] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">{label}</label>
                <select value={settings[key] ?? ""} onChange={(e) => saveSetting(key, e.target.value)} className={inputCls}>
                  <option value="">Escolha…</option>
                  {payments.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Chaves */}
        <div className={card}>
          <h2 className="font-display text-xl text-primary-dark mb-4">O que a integração faz</h2>
          <div className="space-y-4">
            {TOGGLES.map((t) => {
              const checked = settings[t.key] === "true";
              return (
                <label key={t.key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => saveSetting(t.key, e.target.checked ? "true" : "false")} />
                  <span>
                    <span className="block text-sm text-primary-dark font-medium">{t.label}</span>
                    <span className="block text-xs text-[var(--text-muted)]">{t.desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Vínculo de produtos */}
        <div className={card}>
          <h2 className="font-display text-xl text-primary-dark mb-1 flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" /> Produtos</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Cada produto do site precisa estar ligado ao mesmo produto na Awise. O "Sincronizar" liga sozinho pelo SKU ou pelo
            nome; aqui você confere e corrige.
          </p>
          {unlinked.length > 0 && (
            <div className="flex gap-2 items-start bg-peach/40 text-primary-dark rounded-lg p-3 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {unlinked.length} produto(s) à venda ainda não estão na Awise: <strong>{unlinked.map((p) => p.name).join(", ")}</strong>.
                Cadastre na Awise (dá pra usar o mesmo SKU do site) e clique em Sincronizar. Venda desses produtos não vai para a Awise.
              </span>
            </div>
          )}
          <div className="divide-y divide-border/40">
            {(products ?? []).map((p) => {
              const awId = (p as any).awise_product_id as string | null;
              const aw = awId ? awById.get(awId) : undefined;
              return (
                <div key={p.id} className="py-3 grid grid-cols-1 md:grid-cols-[1fr_1fr_140px] gap-2 items-center">
                  <div className="min-w-0">
                    <p className={`text-sm break-words ${p.is_active ? "text-primary-dark" : "text-[var(--text-muted)]"}`}>
                      {p.name}{!p.is_active && " (rascunho)"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">SKU {p.sku || "—"} · {formatPriceBRL(p.price_cents)}</p>
                  </div>
                  <select
                    value={awId ?? ""}
                    onChange={(e) => link.mutate({ productId: p.id, awiseId: e.target.value || null })}
                    className={inputCls}
                  >
                    <option value="">Sem vínculo</option>
                    {(opts?.products ?? []).map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                  </select>
                  <p className="text-[11px] text-[var(--text-muted)] md:text-right">
                    {aw ? (
                      <>
                        Awise: {aw.stock} un.
                        {aw.price > 0 && aw.price !== p.price_cents && <span className="block text-[#B7791F]">preço lá {formatPriceBRL(aw.price)}</span>}
                      </>
                    ) : awId ? "—" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
