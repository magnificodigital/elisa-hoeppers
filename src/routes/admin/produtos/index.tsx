import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ImageOff } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { listAllProductsForAdmin, formatPriceBRL, firstImage, createProduct } from "@/lib/shop";

export const Route = createFileRoute("/admin/produtos/")({
  head: () => ({ meta: [{ title: "Admin — Produtos" }] }),
  component: () => (
    <StaffGuard>
      <AdminProductsList />
    </StaffGuard>
  ),
});

function AdminProductsList() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: listAllProductsForAdmin,
  });

  const create = useMutation({
    mutationFn: async () => {
      const order = (products?.length ?? 0) + 1;
      return createProduct({
        slug: `produto-${Date.now().toString(36)}`,
        name: "Novo produto",
        short_description: null,
        description: null,
        price_cents: 0,
        compare_at_price_cents: null,
        in_stock: false,
        is_active: false,
        is_featured: false,
        gallery: [],
        category: null,
        display_order: order,
        weight_g: null,
        length_cm: null,
        width_cm: null,
        height_cm: null,
        brand: null,
        ritual_id: null,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-[var(--surface-cream)] min-h-screen">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Produtos</h1>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark transition disabled:opacity-60"
            >
              <Plus className="w-4 h-4" /> Novo produto
            </button>
          </div>
          <p className="text-[var(--text-muted)] mb-8 text-sm">Gerencie o catálogo da loja.</p>

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          <div className="space-y-3">
            {(products ?? []).map((p) => (
              <div key={p.id} className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-md bg-sand border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {firstImage(p) ? (
                    <img src={firstImage(p)!} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-primary-dark break-words">{p.name}</h3>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">/loja/{p.slug} · {p.category ?? "sem categoria"}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {p.is_active ? (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">Ativo</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cream text-[var(--text-muted)] whitespace-nowrap">Rascunho</span>
                    )}
                    {p.in_stock ? (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary-dark/10 text-primary-dark whitespace-nowrap">Em estoque</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">Sem estoque</span>
                    )}
                    {p.is_featured && (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-peach/40 text-primary-dark whitespace-nowrap">Destaque</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-primary-dark">{formatPriceBRL(p.price_cents)}</p>
                </div>
                <Link
                  to="/admin/produtos/$id"
                  params={{ id: p.id }}
                  className="shrink-0 text-xs uppercase tracking-widest text-primary hover:opacity-70"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
