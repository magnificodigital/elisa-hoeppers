import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, MessageCircle, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { getProductBySlug, formatPriceBRL, firstImage, createReservation, type Product } from "@/lib/shop";
import { isVideoUrl } from "@/lib/storage";
import { useCart } from "@/lib/cart";
import { WishlistButton } from "@/components/WishlistButton";

export const Route = createFileRoute("/loja/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.product;
    const url = `https://bodyogaoficial.com.br/loja/${params.slug}`;
    const image = p?.gallery?.[0]?.url;
    return {
      meta: [
        { title: `${p?.name ?? "Produto"} — Loja BODYOGA` },
        { name: "description", content: p?.short_description ?? "" },
        { property: "og:title", content: p?.name ?? "" },
        { property: "og:description", content: p?.short_description ?? "" },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.name,
                description: p.short_description ?? undefined,
                image: image ? [image] : undefined,
                url,
                brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
                offers: {
                  "@type": "Offer",
                  price: (p.price_cents / 100).toFixed(2),
                  priceCurrency: "BRL",
                  availability: p.in_stock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                  url,
                },
              }),
            },
          ]
        : [],
    };
  },
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

  const wppMessage = encodeURIComponent(
    `Oi Elisa! Tenho interesse no ${product.name} (${formatPriceBRL(product.price_cents)}). Como faço pra comprar?`
  );
  const wppLink = `https://wa.me/5511994061178?text=${wppMessage}`;

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
                  isVideoUrl(product.gallery[activeImage].url) ? (
                    <video
                      src={product.gallery[activeImage].url}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={product.gallery[activeImage].url}
                      alt={product.gallery[activeImage].alt ?? product.name}
                      className="w-full h-full object-cover"
                    />
                  )
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
                      {isVideoUrl(img.url) ? (
                        <video src={img.url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img
                          src={img.url}
                          alt={img.alt ?? ""}
                          className="w-full h-full object-cover"
                        />
                      )}
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
                <div className="mt-6">
                  <div className="mb-4 text-center bg-sand text-[var(--text-muted)] py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold">
                    Fora de estoque
                  </div>
                  <ReservationForm product={product} />
                </div>
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

              <div className="mt-8 space-y-3 text-sm text-[var(--text-muted)]">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Pagamento via PIX ou cartão
                </p>
                <div className="flex items-center gap-2">
                  {/* Visa */}
                  <span className="inline-flex items-center justify-center h-7 w-11 rounded border border-border bg-white">
                    <svg viewBox="0 0 48 16" className="h-3" aria-label="Visa" role="img">
                      <text x="0" y="13" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fontStyle="italic" fill="#1A1F71">VISA</text>
                    </svg>
                  </span>
                  {/* Mastercard */}
                  <span className="inline-flex items-center justify-center h-7 w-11 rounded border border-border bg-white">
                    <svg viewBox="0 0 40 24" className="h-5" aria-label="Mastercard" role="img">
                      <circle cx="16" cy="12" r="9" fill="#EB001B" />
                      <circle cx="24" cy="12" r="9" fill="#F79E1B" />
                      <path d="M20 5a9 9 0 000 14 9 9 0 000-14z" fill="#FF5F00" />
                    </svg>
                  </span>
                  {/* PIX */}
                  <span className="inline-flex items-center justify-center h-7 w-11 rounded border border-border bg-white">
                    <svg viewBox="0 0 48 16" className="h-3" aria-label="Pix" role="img">
                      <text x="0" y="13" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700" fill="#32BCAD">Pix</text>
                    </svg>
                  </span>
                </div>
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

function ReservationForm({ product }: { product: Product }) {
  const [waitEmail, setWaitEmail] = useState("");
  const [waitWhatsapp, setWaitWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!waitEmail.trim()) return setError("Informe seu e-mail.");
    if (!waitWhatsapp.trim()) return setError("Informe seu WhatsApp.");
    
    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("product_waitlist").insert({
        product_id: product.id,
        email: waitEmail,
        whatsapp: waitWhatsapp,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          setSuccess("Você já está na lista! Vamos te avisar. 💛");
        } else {
          setError("Não foi possível cadastrar. Tente novamente.");
        }
        return;
      }

      // Notifica o admin
      supabase.functions.invoke("send-notification", {
        body: { 
          type: "waitlist_signup", 
          payload: { 
            product_id: product.id, 
            product_name: product.name, 
            email: waitEmail, 
            whatsapp: waitWhatsapp 
          } 
        },
      }).catch(() => {});

      setSuccess("Pronto! Vamos te avisar por email assim que chegar. 💛");
    } catch (err) {
      setError("Erro ao processar sua solicitação.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-sand/50 border border-primary/10 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
        <p className="text-primary-dark font-medium">{success}</p>
      </div>
    );
  }

  const inputCls =
    "w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-primary-dark focus:outline-none focus:border-primary transition shadow-sm";

  return (
    <div className="bg-sand/30 border border-border rounded-2xl p-6 space-y-4">
      <div className="space-y-1">
        <p className="text-primary-dark font-medium">😔 Esgotado no momento</p>
        <p className="text-xs text-[var(--text-muted)]">
          Quer ser avisada assim que voltar? Deixa seu contato:
        </p>
      </div>
      
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          placeholder="Seu e-mail"
          value={waitEmail}
          onChange={(e) => setWaitEmail(e.target.value)}
          required
          className={inputCls}
        />
        <input
          type="tel"
          placeholder="Seu WhatsApp"
          value={waitWhatsapp}
          onChange={(e) => setWaitWhatsapp(e.target.value)}
          required
          className={inputCls}
        />
        {error && <p className="text-[10px] text-red-600 font-medium">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white py-3.5 rounded-full uppercase tracking-[0.2em] text-[10px] font-bold hover:bg-primary-dark transition disabled:opacity-50 shadow-md"
        >
          {submitting ? "Enviando..." : "Avise-me quando chegar"}
        </button>
      </form>
    </div>
  );
}


