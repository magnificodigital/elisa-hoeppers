import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, ShoppingBag } from "lucide-react";
import Layout from "@/components/Layout";
import { useCart } from "@/lib/cart";
import { formatPriceBRL } from "@/lib/shop";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — Elisa Hoeppers" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQty, removeItem, subtotalCents, totalItems, clear } = useCart();
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="py-16 md:py-24 bg-cream min-h-screen">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6">
          <h1 className="font-display text-4xl md:text-5xl text-primary-dark">
            Seu carrinho
          </h1>
          <p className="text-[var(--text-muted)] mt-2">
            {totalItems === 0
              ? "Vazio."
              : `${totalItems} ${totalItems === 1 ? "item" : "itens"}`}
          </p>

          {totalItems === 0 ? (
            <div className="mt-12 bg-white rounded-lg p-12 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" />
              <p className="text-primary-dark mb-6">Seu carrinho está vazio.</p>
              <Link
                to="/loja"
                className="inline-block bg-primary text-white px-6 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition"
              >
                Explorar loja
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
              {/* Itens */}
              <div className="bg-white rounded-lg p-6 space-y-5">
                {items.map((it) => (
                  <div
                    key={it.product_id}
                    className="flex gap-4 pb-5 border-b border-border last:border-0 last:pb-0"
                  >
                    {it.image && (
                      <Link
                        to="/loja/$slug"
                        params={{ slug: it.slug }}
                        className="block w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-sand"
                      >
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/loja/$slug"
                        params={{ slug: it.slug }}
                        className="text-primary-dark font-medium hover:text-primary"
                      >
                        {it.name}
                      </Link>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {formatPriceBRL(it.unit_price_cents)} cada
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="inline-flex items-center border border-border rounded-full overflow-hidden">
                          <button
                            onClick={() => updateQty(it.product_id, it.qty - 1)}
                            className="w-8 h-8 hover:bg-cream/50 text-primary-dark"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm text-primary-dark">
                            {it.qty}
                          </span>
                          <button
                            onClick={() => updateQty(it.product_id, it.qty + 1)}
                            className="w-8 h-8 hover:bg-cream/50 text-primary-dark"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(it.product_id)}
                          className="ml-2 text-[var(--text-muted)] hover:text-red-700 text-xs uppercase tracking-widest inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remover
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display text-lg text-primary-dark">
                        {formatPriceBRL(it.unit_price_cents * it.qty)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <Link to="/loja" className="text-xs uppercase tracking-widest text-primary-dark hover:text-primary">
                    ← Continuar comprando
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm("Limpar carrinho?")) clear();
                    }}
                    className="text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-red-700"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* Resumo */}
              <aside className="bg-white rounded-lg p-6 self-start">
                <h2 className="font-display text-xl text-primary-dark mb-4">Resumo</h2>
                <div className="space-y-2 mb-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Subtotal</span>
                    <span className="text-primary-dark">{formatPriceBRL(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Frete</span>
                    <span className="italic text-[var(--text-muted)]">Combinado por WhatsApp</span>
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-border mb-5">
                  <span className="font-display text-lg text-primary-dark">Total</span>
                  <span className="font-display text-2xl text-primary-dark">
                    {formatPriceBRL(subtotalCents)}
                  </span>
                </div>
                <button
                  onClick={() => navigate({ to: "/checkout" })}
                  className="block w-full text-center bg-primary text-white py-3.5 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition"
                >
                  Finalizar pedido
                </button>
                <p className="text-[10px] text-[var(--text-muted)] text-center mt-3 leading-relaxed">
                  Pagamento e frete combinados diretamente com a Elisa via WhatsApp.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
