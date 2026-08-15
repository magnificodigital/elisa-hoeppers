import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ImageOff, Instagram, Copy, Check } from "lucide-react";
import { listAllProductsForAdmin, formatPriceBRL, firstImage, createProduct } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/produtos/")({
  head: () => ({ meta: [{ title: "Admin — Produtos" }] }),
  component: () => (
    
      <AdminProductsList />
    
  ),
});

function AdminProductsList() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: listAllProductsForAdmin,
  });

  const { data: waitlists } = useQuery({
    queryKey: ["all-waitlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_waitlist")
        .select("product_id")
        .eq("notified", false);
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.product_id] = (counts[item.product_id] || 0) + 1;
      });
      return counts;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const order = (products?.length ?? 0) + 1;
      return createProduct({
        slug: `produto-${Date.now().toString(36)}`,
        name: "Novo produto",
        sku: `BOD-${Date.now().toString(36).toUpperCase()}`,
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
        ncm: null,
        cfop: null,
        unit_of_measure: null,
        gross_weight_kg: null,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  return (
    
      <section className="py-12 md:py-20 bg-background min-h-screen">
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
          <p className="text-[var(--text-muted)] mb-6 text-sm">Gerencie o catálogo da loja.</p>

          <InstagramFeedCard />



          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          <div className="space-y-3">
            {(products ?? []).map((p) => (
              <div key={p.id} className="bg-white border border-border/20 rounded-lg p-4 flex items-center gap-4 shadow-none">
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
                  <p className="text-[11px] text-[var(--text-muted)] truncate">SKU: {p.sku || "—"}</p>
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
                  {waitlists && waitlists[p.id] > 0 && (
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                        {waitlists[p.id]} na fila
                      </span>
                    </div>
                  )}
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
    
  );
}

function InstagramFeedCard() {
  const [copied, setCopied] = useState(false);
  const feedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/instagram-feed.xml`
      : "/api/public/instagram-feed.xml";

  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bg-white border border-border/20 rounded-lg p-5 mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Instagram className="w-5 h-5 text-primary" />
        <h2 className="font-medium text-primary-dark">Lojinha do Instagram</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        Conecte seus produtos ao Instagram Shopping usando o feed de catálogo abaixo. No{" "}
        <a
          href="https://business.facebook.com/commerce"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Meta Commerce Manager
        </a>
        , crie um catálogo → <strong>Fontes de dados</strong> → <strong>Feed de dados</strong> →{" "}
        <strong>Agendado</strong> e cole este endereço. A Meta atualiza os produtos automaticamente.
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={feedUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 border border-border rounded-md px-3 py-2 bg-cream/40 text-sm text-primary-dark"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark transition"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="text-[10px] text-[var(--text-muted)] mt-2">
        Apenas produtos ativos com imagem aparecem no feed. Requer uma conta comercial no Instagram conectada ao Facebook.
      </p>
    </div>
  );
}

