import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { ImageUploader } from "@/components/ImageUploader";
import { getProductForAdmin, updateProduct, deleteProduct, listActiveRituals, type ProductImage } from "@/lib/shop";
import { centsToBRL, formatBRLInput } from "@/lib/currency";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/admin/produtos/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar produto" }] }),
  component: () => (
    <StaffGuard>
      <ProductEditPage />
    </StaffGuard>
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
    mutationFn: () => {
      const pct = discountPct === "" ? 0 : Math.min(99, Math.max(0, Number(discountPct)));
      const compareAt = pct > 0 ? Math.round(form.price_cents / (1 - pct / 100)) : null;
      return updateProduct(id, {
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




  if (isLoading) {
    return (
      <Layout>
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Carregando…</p></section>
      </Layout>
    );
  }
  if (!product) {
    return (
      <Layout>
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Produto não encontrado.</p></section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-[var(--surface-cream)] min-h-screen">
        <div className="container mx-auto px-6 max-w-3xl">
          <Link to="/admin/produtos" className="text-xs uppercase tracking-widest text-primary hover:opacity-70 inline-flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mt-3 mb-6">Editar produto</h1>

          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
            className="bg-white rounded-lg p-6 md:p-8 space-y-5"
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
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-2">Imagens / vídeos (até 3)</label>
              <div className="flex flex-wrap gap-4">
                {form.gallery.map((img, i) => (
                  <ImageUploader
                    key={i}
                    value={img.url}
                    folder="products"
                    allowVideo
                    onChange={(url) => {
                      if (url) {
                        const next = [...form.gallery];
                        next[i] = { url, alt: form.name };
                        setForm({ ...form, gallery: next });
                      } else {
                        setForm({ ...form, gallery: form.gallery.filter((_, idx) => idx !== i) });
                      }
                    }}
                  />
                ))}
                {form.gallery.length < 3 && (
                  <ImageUploader
                    value={null}
                    folder="products"
                    label="Adicionar"
                    allowVideo
                    onChange={(url) => {
                      if (url) setForm({ ...form, gallery: [...form.gallery, { url, alt: form.name }] });
                    }}
                  />
                )}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2">Até 3 mídias. Imagens (máx 8MB) ou vídeos (máx 50MB). Para remover, clique no X.</p>

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
    </Layout>
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
