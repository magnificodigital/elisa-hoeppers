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
    <div className={`group bg-bodyoga-cream rounded-2xl overflow-hidden transition flex flex-col h-full ${noBorder ? "" : "border border-bodyoga-brown/15 hover:border-bodyoga-brown/40"}`}>
      <Link
        to="/loja/$slug"
        params={{ slug: product.slug }}
        className="relative aspect-square overflow-hidden bg-bodyoga-green/5 block"
      >
        <GaleriaProduto 
          images={product.gallery?.map(g => g.url) || []} 
          alt={product.name}
          showControls={false}
        />
      </Link>
      
      <div className="p-6 flex flex-col flex-1 text-left">
        {sub && (
          <p className="text-xs uppercase tracking-[0.2em] text-bodyoga-brown">{sub}</p>
        )}
        <Link to="/loja/$slug" params={{ slug: product.slug }}>
          <h3 className="font-display text-lg text-bodyoga-green mt-1 hover:opacity-80 transition">{main}</h3>
        </Link>
        
        {product.short_description && (
          <p className="mt-2 text-sm text-bodyoga-green/70 leading-relaxed line-clamp-3 flex-1">
            {product.short_description}
          </p>
        )}
        
        <div className="mt-5 pt-2">
          <span className="block text-bodyoga-green font-medium mb-3">
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
            className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-bodyoga-green px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-bodyoga-cream transition hover:bg-bodyoga-green/90"
          >
            Comprar <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
