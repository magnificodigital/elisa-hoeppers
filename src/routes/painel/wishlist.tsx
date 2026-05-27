import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bookmark, GraduationCap, ShoppingBag, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { listMyWishlist, removeFromWishlist } from "@/lib/wishlist";
import { formatPriceBRL } from "@/lib/shop";

export const Route = createFileRoute("/painel/wishlist")({
  head: () => ({ meta: [{ title: "Lista de desejos — Elisa Hoeppers" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user)
      navigate({ to: "/login", search: { next: "/painel/wishlist" } });
  }, [loading, user, navigate]);

  const { data: items, isLoading } = useQuery({
    queryKey: ["my-wishlist", user?.id],
    queryFn: listMyWishlist,
    enabled: !!user,
  });

  const remove = useMutation({
    mutationFn: (params: { type: "course" | "product"; id: string }) =>
      removeFromWishlist(params.type, params.id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["my-wishlist", user?.id] }),
  });

  if (loading || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark">Carregando…</p>
        </div>
      </Layout>
    );
  }

  const courses = (items ?? []).filter((i) => i.item_type === "course");
  const products = (items ?? []).filter((i) => i.item_type === "product");

  return (
    <Layout>
      <section className="py-10 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            to="/painel"
            className="text-sm text-primary-dark/70 hover:text-primary-dark"
          >
            ← Voltar ao painel
          </Link>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <Bookmark className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl text-primary-dark">
              Lista de desejos
            </h1>
          </div>
          <p className="text-primary-dark/70 mb-8">
            Salve cursos e produtos para acessar mais tarde.
          </p>

          {isLoading && <p className="text-primary-dark/70">Carregando…</p>}

          {!isLoading && (items?.length ?? 0) === 0 && (
            <div className="bg-white rounded-lg p-10 text-center">
              <Bookmark className="w-10 h-10 text-primary-dark/30 mx-auto mb-3" />
              <p className="text-primary-dark mb-6">Sua lista está vazia.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/cursos"
                  className="bg-primary text-white px-6 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
                >
                  Explorar aulas
                </Link>
                <Link
                  to="/loja"
                  className="border border-primary text-primary px-6 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary hover:text-white transition"
                >
                  Ver loja
                </Link>
              </div>
            </div>
          )}

          {courses.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-xl text-primary-dark flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" />
                Aulas ({courses.length})
              </h2>
              <div className="space-y-3">
                {courses.map(
                  (it) =>
                    it.course && (
                      <div
                        key={it.id}
                        className="flex items-center gap-4 bg-white rounded-lg p-3"
                      >
                        <div className="w-24 h-16 rounded overflow-hidden bg-cream shrink-0">
                          {it.course.cover_image && (
                            <img
                              src={it.course.cover_image}
                              alt={it.course.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to="/cursos/$slug"
                            params={{ slug: it.course.slug }}
                            className="font-display text-base text-primary-dark hover:text-primary block truncate"
                          >
                            {it.course.title}
                          </Link>
                          {it.course.subtitle && (
                            <p className="text-xs text-primary-dark/60 truncate">
                              {it.course.subtitle}
                            </p>
                          )}
                          <p className="text-[11px] text-primary-dark/40 mt-1">
                            Salvo em{" "}
                            {new Date(it.added_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Link
                          to="/cursos/$slug"
                          params={{ slug: it.course.slug }}
                          className="text-xs uppercase tracking-widest text-primary hover:underline"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() =>
                            remove.mutate({
                              type: "course",
                              id: it.course!.id,
                            })
                          }
                          className="text-[var(--text-muted)] hover:text-red-700"
                          aria-label="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div>
              <h2 className="font-display text-xl text-primary-dark flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Produtos ({products.length})
              </h2>
              <div className="space-y-3">
                {products.map(
                  (it) =>
                    it.product && (
                      <div
                        key={it.id}
                        className="flex items-center gap-4 bg-white rounded-lg p-3"
                      >
                        <div className="w-24 h-16 rounded overflow-hidden bg-cream shrink-0">
                          {it.product.gallery[0]?.url && (
                            <img
                              src={it.product.gallery[0].url}
                              alt={it.product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to="/loja/$slug"
                            params={{ slug: it.product.slug }}
                            className="font-display text-base text-primary-dark hover:text-primary block truncate"
                          >
                            {it.product.name}
                          </Link>
                          <p className="text-sm text-primary-dark">
                            {it.product.in_stock
                              ? formatPriceBRL(it.product.price_cents)
                              : "Fora de estoque"}
                          </p>
                          <p className="text-[11px] text-primary-dark/40 mt-1">
                            Salvo em{" "}
                            {new Date(it.added_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Link
                          to="/loja/$slug"
                          params={{ slug: it.product.slug }}
                          className="text-xs uppercase tracking-widest text-primary hover:underline"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() =>
                            remove.mutate({
                              type: "product",
                              id: it.product!.id,
                            })
                          }
                          className="text-[var(--text-muted)] hover:text-red-700"
                          aria-label="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
