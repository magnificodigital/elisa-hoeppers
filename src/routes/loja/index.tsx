import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import {
  listProducts,
  listActiveRituals,
  formatPriceBRL,
  firstImage,
  type Product,
} from "@/lib/shop";

export const Route = createFileRoute("/loja/")({
  validateSearch: (s: Record<string, unknown>) => ({
    brand: typeof s.brand === "string" ? s.brand : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop — Elisa Hoeppers" },
      {
        name: "description",
        content:
          "Óleos essenciais, sprays, difusores, pesinhos BODYOGA e mais — produtos organizados por rituais e selecionados por Elisa Hoeppers.",
      },
    ],
  }),
  component: ShopListing,
});

function ShopListing() {
  const { brand: brandFilter } = Route.useSearch();
  const [activeRitual, setActiveRitual] = useState<string>("all");
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => listProducts(),
  });

  const { data: rituals } = useQuery({
    queryKey: ["rituals", "active"],
    queryFn: () => listActiveRituals(),
  });

  const baseList = useMemo(() => {
    let list = products ?? [];
    if (brandFilter)
      list = list.filter(
        (p) => (p.brand ?? "").toLowerCase() === brandFilter.toLowerCase(),
      );
    if (!showOutOfStock) list = list.filter((p) => p.in_stock);
    return list;
  }, [products, showOutOfStock, brandFilter]);

  const productRituals = (p: Product): string[] =>
    p.ritual_ids && p.ritual_ids.length > 0
      ? p.ritual_ids
      : p.ritual_id
        ? [p.ritual_id]
        : [];

  // Groups to render: each active ritual with its products, then "others".
  const groups = useMemo(() => {
    const activeRituals = (rituals ?? []).filter(
      (r) => activeRitual === "all" || r.id === activeRitual,
    );
    const result = activeRituals.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      products: baseList.filter((p) => productRituals(p).includes(r.id)),
    }));

    if (activeRitual === "all") {
      const orphans = baseList.filter((p) => productRituals(p).length === 0);
      if (orphans.length > 0) {
        result.push({
          id: "__others__",
          title: "Outros produtos",
          description: null,
          products: orphans,
        });
      }
    }
    return result.filter((g) => g.products.length > 0);
  }, [rituals, baseList, activeRitual]);

  return (
    <Layout>
      <section className="py-16 md:py-24 bg-cream min-h-screen">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6">
          <h1 className="sr-only">Shop</h1>

          {/* Filtros por ritual */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              onClick={() => setActiveRitual("all")}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                activeRitual === "all"
                  ? "bg-primary text-white"
                  : "bg-white text-primary-dark border border-border hover:border-primary"
              }`}
            >
              Todos
            </button>
            {(rituals ?? []).map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRitual(r.id)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                  activeRitual === r.id
                    ? "bg-primary text-white"
                    : "bg-white text-primary-dark border border-border hover:border-primary"
                }`}
              >
                {r.title}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm text-primary-dark ml-2">
              <input
                type="checkbox"
                checked={!showOutOfStock}
                onChange={(e) => setShowOutOfStock(!e.target.checked)}
                className="accent-primary"
              />
              Só disponíveis
            </label>
          </div>

          {isLoading && (
            <p className="text-center text-[var(--text-muted)] mt-12">
              Carregando produtos…
            </p>
          )}

          {!isLoading && groups.length === 0 && (
            <p className="text-center text-[var(--text-muted)] mt-12">
              Nenhum produto neste filtro.
            </p>
          )}

          <div className="mt-14 space-y-16">
            {groups.map((g) => (
              <div key={g.id}>
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl md:text-3xl text-primary-dark">
                    {g.title}
                  </h2>
                  {g.description && (
                    <p className="mt-2 text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
                      {g.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
                  {g.products.map((p) => (
                    <Link
                      key={p.slug}
                      to="/loja/$slug"
                      params={{ slug: p.slug }}
                      className="group block"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-sand">
                        {firstImage(p) && (
                          <img
                            src={firstImage(p)!}
                            alt={p.name}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${secondImage(p) ? "group-hover:opacity-0" : ""}`}
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        {secondImage(p) && (
                          <img
                            src={secondImage(p)!}
                            alt={p.name}
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            loading="lazy"
                            decoding="async"
                          />
                        )}

                        {!p.in_stock && (
                          <span className="absolute top-3 right-3 bg-primary-dark text-white text-[11px] px-3 py-1 rounded-md tracking-wide">
                            Esgotado
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-medium text-primary-dark">
                        {p.name}
                      </h3>
                      {p.in_stock ? (
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {formatPriceBRL(p.price_cents)}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--text-muted)] mt-1 italic">
                          indisponível no momento
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
