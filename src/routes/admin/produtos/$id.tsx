import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { ImageUploader } from "@/components/ImageUploader";
import { getProductForAdmin, updateProduct, deleteProduct, type ProductImage } from "@/lib/shop";

export const Route = createFileRoute("/admin/produtos/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar produto" }] }),
  component: () => (
    <AdminGuard>
      <ProductEditPage />
    </AdminGuard>
  ),
});

const CATEGORIES = ["oleos", "ambiente", "cuidados", "bodyoga"];

function ProductEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getProductForAdmin(id),
  });

  const [form, setForm] = useState({
    name: "",
    slug: "",
    short_description: "",
    description: "",
    price_cents: 0,
    compare_at_price_cents: "" as string | number,
    in_stock: true,
    is_active: true,
    is_featured: false,
    category: "",
    display_order: 0,
    gallery: [] as ProductImage[],
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        short_description: product.short_description ?? "",
        description: product.description ?? "",
        price_cents: product.price_cents,
        compare_at_price_cents: product.compare_at_price_cents ?? "",
        in_stock: product.in_stock,
        is_active: product.is_active,
        is_featured: product.is_featured,
        category: product.category ?? "",
        display_order: product.display_order,
        gallery: product.gallery,
      });
    }
  }, [product]);

  const save = useMutation({
    mutationFn: () => updateProduct(id, {
      name: form.name,
      slug: form.slug,
      short_description: form.short_description || null,
      description: form.description || null,
      price_cents: form.price_cents,
      compare_at_price_cents: form.compare_at_price_cents === "" ? null : Number(form.compare_at_price_cents),
      in_stock: form.in_stock,
      is_active: form.is_active,
      is_featured: form.is_featured,
      category: form.category || null,
      display_order: form.display_order,
      gallery: form.gallery,
    }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", id] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setTimeout(() => setSaved(false), 2500);
    },
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

            <Field label="Descrição curta (card)">
              <textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} rows={2} className={inputCls} />
            </Field>

            <Field label="Descrição completa (página do produto)">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço (em centavos)">
                <input required type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: parseInt(e.target.value) || 0 })} className={inputCls} />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Ex.: 7100 = R$ 71,00</p>
              </Field>
              <Field label="Preço 'de' (vazio = sem desconto)">
                <input type="number" value={form.compare_at_price_cents} onChange={(e) => setForm({ ...form, compare_at_price_cents: e.target.value })} className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  <option value="">— sem categoria —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Ordem">
                <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputCls} />
              </Field>
            </div>

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
              <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-2">Imagens</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {form.gallery.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-sand border border-border">
                    <img src={img.url} alt={img.alt ?? ""} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-red-700 hover:bg-white flex items-center justify-center"
                      aria-label="Remover imagem"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="URL da imagem (ex.: /images/products/foto.png)"
                  className={inputCls + " flex-1"}
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="bg-primary text-white px-4 py-2 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Cole o caminho da imagem (ex.: /images/products/algo.png) ou URL completa.</p>
            </div>

            {save.error && <p className="text-red-700 text-sm">{(save.error as Error).message}</p>}

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <button type="submit" disabled={save.isPending}
                className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60">
                {save.isPending ? "Salvando…" : "Salvar"}
              </button>
              {saved && <span className="text-sm text-primary-dark">✓ Salvo</span>}
              <Link to="/loja/$slug" params={{ slug: form.slug }} target="_blank"
                className="ml-auto text-xs uppercase tracking-widest text-primary hover:opacity-70">
                Ver na loja →
              </Link>
              <button
                type="button"
                onClick={() => { if (confirm("Excluir produto? Esta ação não pode ser desfeita.")) del.mutate(); }}
                className="text-xs uppercase tracking-widest text-red-700 hover:opacity-70 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
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
