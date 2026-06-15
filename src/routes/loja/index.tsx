import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { listProducts, formatPriceBRL, firstImage } from "@/lib/shop";

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
          "Óleos essenciais, sprays, difusores, pesinhos BODYOGA e mais — produtos selecionados por Elisa Hoeppers.",
      },
    ],
  }),
  component: ShopListing,
});

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "oleos", label: "Rituais da Mente" },
  { id: "ambiente", label: "Rituais da Ambiente" },
  { id: "cuidados", label: "Rituais da Corpo" },
  { id: "bodyoga", label: "BODYOGA" },
];

function ShopListing() {
  
  const { brand: brandFilter } = Route.useSearch();
  const [category, setCategory] = useState("all");
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => listProducts(),
  });

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (brandFilter)
      list = list.filter(
        (p) => (p.brand ?? "").toLowerCase() === brandFilter.toLowerCase(),
      );
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (!showOutOfStock) list = list.filter((p) => p.in_stock);
    return list;
  }, [products, category, showOutOfStock, brandFilter]);

  return (
    <Layout>
      <section className="py-16 md:py-24 bg-cream min-h-screen">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6">
          <h1 className="font-display text-4xl md:text-5xl text-primary-dark text-center">
            Shop
          </h1>
          <p className="text-center text-[var(--text-muted)] mt-3 max-w-xl mx-auto">
            Produtos selecionados pra apoiar sua prática e seu ritual de cuidado.
          </p>






          {/* Filtros */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                  category === c.id
                    ? "bg-primary text-white"
                    : "bg-white text-primary-dark border border-border hover:border-primary"
                }`}
              >
                {c.label}
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

          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-[var(--text-muted)] mt-12">
              Nenhum produto neste filtro.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 mt-12">
            {filtered.map((p) => (
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     loading="lazy" decoding="async" />
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
      </section>
    </Layout>
  );
}
