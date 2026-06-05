import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, MessageCircle, Truck, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { getProductBySlug, formatPriceBRL, firstImage, type Product } from "@/lib/shop";
import { useCart } from "@/lib/cart";
import { WishlistButton } from "@/components/WishlistButton";
import { ProductReviews } from "@/components/ProductReviews";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { getProductRatingSummary, hasPurchasedProduct } from "@/lib/productReviews";

export const Route = createFileRoute("/loja/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Produto"} — Loja Elisa Hoeppers` },
      { name: "description", content: loaderData?.product.short_description ?? "" },
      { property: "og:title", content: loaderData?.product.name ?? "" },
      {
        property: "og:description",
        content: loaderData?.product.short_description ?? "",
      },
      {
        property: "og:image",
        content: loaderData?.product.gallery?.[0]?.url ?? "",
      },
    ],
  }),
  notFoundComponent: () => (
    <Layout>
      <div className="max-w-[1170px] mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-primary-dark mb-4">
          Produto não encontrado
        </h1>
        <Link to="/loja" className="text-primary underline">
          Voltar pra loja
        </Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout>
      <div className="max-w-[1170px] mx-auto px-4 py-24 text-center">
        <p className="text-primary-dark">{error.message}</p>
      </div>
    </Layout>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const [activeImage, setActiveImage] = useState(0);
  const { user } = useAuth();

  const { data: ratingSummary } = useQuery({
    queryKey: ["product-rating-summary", product.id],
    queryFn: () => getProductRatingSummary(product.id),
  });

  const { data: canReview } = useQuery({
    queryKey: ["can-review-product", user?.id, product.id],
    queryFn: () => hasPurchasedProduct(product.id),
    enabled: !!user,
  });
  const wppMessage = encodeURIComponent(
    `Oi Elisa! Tenho interesse no ${product.name} (${formatPriceBRL(product.price_cents)}). Como faço pra comprar?`
  );
  const wppLink = `https://wa.me/5547999999999?text=${wppMessage}`;

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-cream min-h-screen">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6">
          <Link
            to="/loja"
            className="inline-flex items-center gap-1 text-sm text-primary-dark hover:text-primary mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Loja
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {/* Galeria */}
            <div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-sand">
                {product.gallery?.[activeImage] && (
                  <img
                    src={product.gallery[activeImage].url}
                    alt={product.gallery[activeImage].alt ?? product.name}
                    className="w-full h-full object-cover"
                  />
                )}
                {!product.in_stock && (
                  <span className="absolute top-4 right-4 bg-primary-dark text-white text-xs px-3 py-1 rounded-md tracking-wide">
                    Fora De Estoque
                  </span>
                )}
              </div>

              {product.gallery && product.gallery.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {product.gallery.map((img: { url: string; alt?: string }, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`aspect-square rounded-md overflow-hidden border-2 ${
                        i === activeImage ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt ?? ""}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {product.category && (
                <p className="text-xs uppercase tracking-widest text-primary mb-2">
                  {product.category}
                </p>
              )}
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark">
                {product.name}
              </h1>

              {(ratingSummary?.review_count ?? 0) > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating value={Number(ratingSummary!.avg_rating)} size={16} />
                  <span className="text-sm text-[var(--text-muted)]">
                    {Number(ratingSummary!.avg_rating).toFixed(1)} ({ratingSummary!.review_count})
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-3 mt-4">
                {product.compare_at_price_cents &&
                  product.compare_at_price_cents > product.price_cents && (
                    <span className="text-[var(--text-muted)] line-through">
                      {formatPriceBRL(product.compare_at_price_cents)}
                    </span>
                  )}
                <span className="text-2xl font-medium text-primary-dark">
                  {formatPriceBRL(product.price_cents)}
                </span>
              </div>

              {product.short_description && (
                <p className="mt-4 text-[var(--text-muted)] leading-relaxed">
                  {product.short_description}
                </p>
              )}

              {product.in_stock ? (
                <div className="mt-6">
                  <AddToCartButton product={product} />
                </div>
              ) : (
                <button
                  disabled
                  className="mt-6 block w-full text-center bg-sand text-[var(--text-muted)] py-4 rounded-full uppercase tracking-[0.2em] text-xs font-semibold cursor-not-allowed"
                >
                  Fora de estoque
                </button>
              )}

              <a
                href={wppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-primary-dark hover:text-primary"
              >
                <MessageCircle className="w-4 h-4" />
                Tirar dúvida
              </a>

              <div className="mt-4">
                <WishlistButton itemType="product" itemId={product.id} />
              </div>

              <div className="mt-8 space-y-2 text-sm text-[var(--text-muted)]">
                <p className="flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Frete combinado por WhatsApp
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Pagamento via PIX ou cartão
                </p>
              </div>

              {product.description && (
                <div className="mt-10 pt-8 border-t border-border">
                  <h2 className="font-display text-xl text-primary-dark mb-3">
                    Sobre o produto
                  </h2>
                  <p className="text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  function handleAdd(goToCart: boolean) {
    addItem({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image: firstImage(product),
      unit_price_cents: product.price_cents,
      qty,
    });
    if (goToCart) {
      navigate({ to: "/carrinho" });
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-primary-dark">
          Quantidade
        </span>
        <div className="inline-flex items-center border border-border rounded-full overflow-hidden">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-9 h-9 hover:bg-cream/50 text-primary-dark"
          >
            −
          </button>
          <span className="w-10 text-center text-sm text-primary-dark">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="w-9 h-9 hover:bg-cream/50 text-primary-dark"
          >
            +
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => handleAdd(false)}
        className="block w-full text-center border-2 border-primary text-primary py-3.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary hover:text-white transition"
      >
        {added ? "✓ Adicionado ao carrinho" : "Adicionar ao carrinho"}
      </button>
      <button
        type="button"
        onClick={() => handleAdd(true)}
        className="block w-full text-center bg-primary text-white py-3.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition"
      >
        Comprar agora
      </button>
    </div>
  );
}
