import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { getProductForAdmin, updateProduct, deleteProduct, listActiveRituals, type ProductImage } from "@/lib/shop";
import { supabase } from "@/lib/supabase";
import { centsToBRL, formatBRLInput } from "@/lib/currency";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/admin/produtos/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar produto" }] }),
  component: () => (
    
      <ProductEditPage />
    
  ),
});



function ProductEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getProductForAdmin(id),
  });

  const { data: rituals } = useQuery({
    queryKey: ["bodyoga-rituals-active"],
    queryFn: listActiveRituals,
  });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sku: "",
    short_description: "",
    description: "",
    price_cents: 0,
    in_stock: true,
    is_active: true,
    is_featured: false,
    ritual_ids: [] as string[],
    display_order: 0,
    gallery: [] as ProductImage[],
    weight_g: "" as string | number,
    length_cm: "" as string | number,
    width_cm: "" as string | number,
    height_cm: "" as string | number,
    ncm: "",
    cfop: "",
    unit_of_measure: "",
    gross_weight_kg: "" as string | number,
  });
  const [delOpen, setDelOpen] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [discountPct, setDiscountPct] = useState<string>("");

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        sku: product.sku ?? "",
        short_description: product.short_description ?? "",
        description: product.description ?? "",
        price_cents: product.price_cents,
        in_stock: product.in_stock,
        is_active: product.is_active,
        is_featured: product.is_featured,
        ritual_ids: product.ritual_ids ?? (product.ritual_id ? [product.ritual_id] : []),
        display_order: product.display_order,
        gallery: product.gallery,
        weight_g: product.weight_g ?? "",
        length_cm: product.length_cm ?? "",
        width_cm: product.width_cm ?? "",
        height_cm: product.height_cm ?? "",
        ncm: product.ncm ?? "",
        cfop: product.cfop ?? "",
        unit_of_measure: product.unit_of_measure ?? "",
        gross_weight_kg: product.gross_weight_kg ?? "",
      });
      setPriceDisplay(product.price_cents ? centsToBRL(product.price_cents) : "");
      const compare = product.compare_at_price_cents ?? 0;
      if (compare > product.price_cents && compare > 0) {
        setDiscountPct(String(Math.round(((compare - product.price_cents) / compare) * 100)));
      } else {
        setDiscountPct("");
      }
    }
  }, [product]);

  const save = useMutation({
    mutationFn: async () => {
      const pct = discountPct === "" ? 0 : Math.min(99, Math.max(0, Number(discountPct)));
      const compareAt = pct > 0 ? Math.round(form.price_cents / (1 - pct / 100)) : null;
      
      const previousStock = product?.in_stock;
      const newStock = form.in_stock;

      const result = await updateProduct(id, {
        name: form.name,
        slug: form.slug,
        sku: form.sku.trim() || null,
        short_description: form.short_description || null,
        description: form.description || null,
        price_cents: form.price_cents,
        compare_at_price_cents: compareAt,
        in_stock: form.in_stock,
        is_active: form.is_active,
        is_featured: form.is_featured,
        category: null,
        ritual_id: form.ritual_ids[0] ?? null,
        ritual_ids: form.ritual_ids,
        display_order: form.display_order,
        gallery: form.gallery,
        weight_g: form.weight_g === "" ? null : Number(form.weight_g),
        length_cm: form.length_cm === "" ? null : Number(form.length_cm),
        width_cm: form.width_cm === "" ? null : Number(form.width_cm),
        height_cm: form.height_cm === "" ? null : Number(form.height_cm),
        ncm: form.ncm.trim() || null,
        cfop: form.cfop.trim() || null,
        unit_of_measure: form.unit_of_measure.trim() || null,
        gross_weight_kg: form.gross_weight_kg === "" ? null : Number(form.gross_weight_kg),
      });

      // Se saiu de esgotado (false) pra disponível (true), avisa a lista
      if (!previousStock && newStock) {
        supabase.functions.invoke("send-notification", {
          body: { type: "waitlist_restock", payload: { product_id: id } },
        }).catch(err => console.error("restock notification failed:", err));
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Produto atualizado");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", id] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const del = useMutation({
    mutationFn: () => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      navigate({ to: "/admin/produtos" });
    },
  });

  const { data: waitlistCount } = useQuery({
    queryKey: ["product-waitlist-count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("product_waitlist")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id)
        .eq("notified", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const notifyWaitlist = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: { type: "waitlist_restock", payload: { product_id: id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.notified ?? 0} pessoas da lista de espera foram avisadas.`);
      qc.invalidateQueries({ queryKey: ["product-waitlist-count", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });




  if (isLoading) {
    return (
      
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Carregando…</p></section>
      
    );
  }
  if (!product) {
    return (
      
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Produto não encontrado.</p></section>
      
    );
  }

  return (
    
      <section className="py-12 md:py-20 bg-background min-h-screen">
        <div className="container mx-auto px-6 max-w-3xl">
          <Link to="/admin/produtos" className="text-xs uppercase tracking-widest text-primary hover:opacity-70 inline-flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mt-3 mb-6">Editar produto</h1>

          {waitlistCount !== undefined && waitlistCount > 0 && (
            <div className="bg-sand p-4 rounded-lg mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <p className="text-sm text-primary-dark font-medium">
                  Lista de espera: <span className="text-primary">{waitlistCount}</span> interessados aguardando aviso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => notifyWaitlist.mutate()}
                disabled={notifyWaitlist.isPending}
                className="bg-primary text-white px-5 py-2 rounded-full text-[10px] uppercase tracking-wider font-bold hover:bg-primary-dark transition disabled:opacity-50 whitespace-nowrap"
              >
                {notifyWaitlist.isPending ? "Avisando..." : "Avisar lista agora"}
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
            className="bg-white rounded-lg p-6 md:p-8 space-y-5 shadow-none border border-border/20"
          >
            <Field label="Nome">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Slug (URL)">
              <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} />
            </Field>

            <Field label="SKU (código do produto)">
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="ex: BOD-TAPETE-01" className={inputCls} />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Código único para controle de estoque e catálogos (Instagram/Meta). Deixe em branco se não usar.</p>
            </Field>

            <Field label="Descrição curta (card)">
              <textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} rows={2} className={inputCls} />
            </Field>

            <Field label="Descrição completa (página do produto)">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço">
                <input
                  required
                  inputMode="numeric"
                  value={priceDisplay}
                  onChange={(e) => {
                    const { display, cents } = formatBRLInput(e.target.value);
                    setPriceDisplay(display);
                    setForm({ ...form, price_cents: cents });
                  }}
                  placeholder="R$ 71,00"
                  className={inputCls}
                />
              </Field>
              <Field label="Desconto % (vazio = sem desconto)">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  placeholder="ex: 10"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ordem">
                <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputCls} />
              </Field>
            </div>


            <Field label="Rituais BODYOGA (em quais rituais este produto aparece)">
              <div className="flex flex-col gap-2">
                {(rituals ?? []).map((r) => {
                  const checked = form.ritual_ids.includes(r.id);
                  return (
                    <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ritual_ids: e.target.checked
                              ? [...form.ritual_ids, r.id]
                              : form.ritual_ids.filter((x) => x !== r.id),
                          })
                        }
                      />
                      {r.title}
                    </label>
                  );
                })}
                {(rituals ?? []).length === 0 && (
                  <p className="text-[10px] text-[var(--text-muted)]">Nenhum ritual cadastrado.</p>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Selecione um ou mais rituais onde o produto deve aparecer na página BODYOGA. Gerencie os rituais em Admin → Rituais.</p>
            </Field>


            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span className="text-sm text-primary-dark">Ativo no site</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} />
                <span className="text-sm text-primary-dark">Em estoque</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                <span className="text-sm text-primary-dark">Destaque</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-2">Mídias do Produto (até 3, a primeira é a capa)</label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => {
                  const img = form.gallery[i];
                  return (
                    <div key={i} className="relative group">
                      <ImageUploader
                        value={img?.url || null}
                        folder="products"
                        allowVideo
                        label={i === 0 ? "Capa" : `Imagem ${i + 1}`}
                        onChange={(url) => {
                          const next = [...form.gallery];
                          if (url) {
                            next[i] = { url, alt: form.name };
                          } else {
                            next.splice(i, 1);
                          }
                          setForm({ ...form, gallery: next.filter(Boolean).slice(0, 3) });
                        }}
                      />
                      {img && (
                        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex flex-col gap-1">
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...form.gallery];
                                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                  setForm({ ...form, gallery: next });
                                }}
                                className="bg-white/80 p-1 rounded-full hover:bg-white shadow"
                                title="Mover para esquerda"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2">Até 3 mídias. A primeira imagem da lista será usada como capa nos cards da loja.</p>

            </div>

            <div className="border-t border-border pt-5">
              <h2 className="font-display text-lg text-primary-dark mb-1">Envio (Melhor Envio)</h2>
              <p className="text-xs text-primary-dark/60 mb-4">
                Necessário pro cálculo automático de frete. Se ficar vazio, usa o valor padrão de Configurações.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Peso (g)">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.weight_g}
                    onChange={(e) => setForm({ ...form, weight_g: e.target.value === "" ? "" : parseInt(e.target.value) || 0 })}
                    placeholder="ex: 350"
                    className={inputCls}
                  />
                </Field>
                <Field label="Comprimento (cm)">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.length_cm}
                    onChange={(e) => setForm({ ...form, length_cm: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                    placeholder="ex: 20"
                    className={inputCls}
                  />
                </Field>
                <Field label="Largura (cm)">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.width_cm}
                    onChange={(e) => setForm({ ...form, width_cm: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                    placeholder="ex: 15"
                    className={inputCls}
                  />
                </Field>
                <Field label="Altura (cm)">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.height_cm}
                    onChange={(e) => setForm({ ...form, height_cm: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                    placeholder="ex: 10"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h2 className="font-display text-lg text-primary-dark mb-1">Fiscal (Base ERP / NFe)</h2>
              <p className="text-xs text-primary-dark/60 mb-4">
                Necessário para emissão automática de nota fiscal. NCM é obrigatório.
                Consulte sua contadora se tiver dúvida.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="NCM (8 dígitos)">
                  <input
                    value={form.ncm}
                    onChange={(e) => setForm({ ...form, ncm: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                    placeholder="ex: 33049910"
                    className={inputCls}
                  />
                </Field>
                <Field label="CFOP (opcional)">
                  <input
                    value={form.cfop}
                    onChange={(e) => setForm({ ...form, cfop: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="ex: 5102"
                    className={inputCls}
                  />
                </Field>
                <Field label="Unidade">
                  <input
                    value={form.unit_of_measure}
                    onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value.toUpperCase().slice(0, 6) })}
                    placeholder="UN, KG, ML"
                    className={inputCls}
                  />
                </Field>
                <Field label="Peso bruto (kg)">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={form.gross_weight_kg}
                    onChange={(e) => setForm({ ...form, gross_weight_kg: e.target.value === "" ? "" : parseFloat(e.target.value) || 0 })}
                    placeholder="ex: 0.350"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>




            {save.error && <p className="text-red-700 text-sm">{(save.error as Error).message}</p>}

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <button type="submit" disabled={save.isPending}
                className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60">
                {save.isPending ? "Salvando…" : "Salvar"}
              </button>
              <Link to="/loja/$slug" params={{ slug: form.slug }} target="_blank"
                className="ml-auto text-xs uppercase tracking-widest text-primary hover:opacity-70">
                Ver na loja →
              </Link>
              <button
                type="button"
                onClick={() => setDelOpen(true)}
                className="text-xs uppercase tracking-widest text-red-700 hover:opacity-70 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
            <ConfirmDialog
              open={delOpen}
              onOpenChange={setDelOpen}
              title="Excluir produto?"
              description="Esta ação não pode ser desfeita."
              confirmLabel="Sim, excluir"
              variant="destructive"
              onConfirm={() => del.mutate()}
            />
          </form>
        </div>
      </section>
    
  );
}

const inputCls = "w-full border border-border rounded-md px-3 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">{label}</label>
      {children}
    </div>
  );
}
