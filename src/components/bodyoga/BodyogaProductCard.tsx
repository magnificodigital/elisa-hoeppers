import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { formatPriceBRL, type Product } from "@/lib/shop";
import { GaleriaProduto } from "@/components/produto/GaleriaProduto";

export function BodyogaProductCard({ product, noBorder = false }: { product: Product; noBorder?: boolean }) {
  const [main, sub] = product.name.split("—").map((s) => s.trim());

  return (
    <Link
      to="/loja/$slug"
      params={{ slug: product.slug }}
      className={`group block bg-bodyoga-cream rounded-2xl overflow-hidden transition ${noBorder ? "" : "border border-bodyoga-brown/15 hover:border-bodyoga-brown/40"}`}
    >
      <div className="relative aspect-square overflow-hidden bg-bodyoga-green/5">
        <GaleriaProduto 
          images={product.gallery?.map(g => g.url) || []} 
          alt={product.name}
          showControls={false}
        />
      </div>
      <div className="p-6">
        {sub && (
          <p className="text-xs uppercase tracking-[0.2em] text-bodyoga-brown">{sub}</p>
        )}
        <h3 className="font-display text-lg text-bodyoga-green mt-1">{main}</h3>
        {product.short_description && (
          <p className="mt-2 text-sm text-bodyoga-green/70 leading-relaxed line-clamp-3">
            {product.short_description}
          </p>
        )}
        <div className="mt-5">
          <span className="block text-bodyoga-green font-medium">
            {formatPriceBRL(product.price_cents)}
          </span>
          <span className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-full bg-bodyoga-green px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-bodyoga-cream transition">
            Comprar <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
