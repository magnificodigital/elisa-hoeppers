import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { GaleriaProduto } from "@/components/produto/GaleriaProduto";
import { formatPriceBRL, type Product } from "@/lib/shop";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

interface BodyogaProductCardProps {
  product: Product;
  noBorder?: boolean;
}

export function BodyogaProductCard({ product, noBorder = false }: BodyogaProductCardProps) {
  const { addItem } = useCart();
  const [main, sub] = product.name.split("—").map((s) => s.trim());

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden transition flex flex-col h-full ${noBorder ? "" : "border border-bodyoga-green/5 hover:border-bodyoga-green/10 shadow-sm"}`}>
      <Link
        to="/loja/$slug"
        params={{ slug: product.slug }}
        className="relative aspect-square overflow-hidden bg-bodyoga-green/[0.02] block"
      >
        <GaleriaProduto 
          images={product.gallery?.map(g => g.url) || []} 
          alt={product.name}
          showControls={false}
        />
        {!product.in_stock && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-bodyoga-green text-bodyoga-cream text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase">
              Esgotado
            </span>
          </div>
        )}
      </Link>
      
      <div className="p-6 flex flex-col flex-1 text-left">
        {sub && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-bodyoga-green/40 font-bold">{sub}</p>
        )}
        <Link to="/loja/$slug" params={{ slug: product.slug }}>
          <h3 className="font-display text-lg text-bodyoga-green mt-1 hover:opacity-80 transition">{main}</h3>
        </Link>
        
        {product.short_description && (
          <p className="mt-2 text-sm text-bodyoga-green/70 leading-relaxed line-clamp-3 flex-1">
            {product.short_description}
          </p>
        )}
        
        <div className="mt-5 pt-2 flex flex-col gap-3">
          <span className="block text-bodyoga-green font-medium text-base">
            {formatPriceBRL(product.price_cents)}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem({
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                image: product.gallery?.[0]?.url || "",
                unit_price_cents: product.price_cents
              });
              toast.success("Adicionado ao carrinho");
            }}
            disabled={!product.in_stock}
            className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-bodyoga-green px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-bodyoga-cream transition hover:bg-bodyoga-green/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {product.in_stock ? (
              <>Comprar <ArrowRight className="w-3.5 h-3.5" /></>
            ) : (
              "Indisponível"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
