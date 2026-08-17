import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { getProductBySlug } from "@/lib/shop";
import { replaceCart, type CartItem } from "@/lib/cart";

export const Route = createFileRoute("/comprar")({
  head: () => ({ meta: [{ title: "Preparando seu carrinho — BODYOGA" }] }),
  component: ComprarPage,
});

/**
 * Ponto de entrada de finalização de compra vindo da Meta (Instagram/Facebook Shopping).
 * A Meta redireciona para cá com:  ?products=<slug>:<qtd>,<slug>:<qtd>&coupon=<codigo>
 * (o "id" do produto no feed é o slug). Aqui montamos o carrinho exatamente com esses
 * itens e mandamos para /carrinho.
 */
function parseProducts(raw: string): { slug: string; qty: number }[] {
  return raw
    .split(",")
    .map((pair) => {
      const [slug, qty] = pair.split(":");
      return {
        slug: decodeURIComponent((slug ?? "").trim()),
        qty: Math.max(1, parseInt(qty ?? "1", 10) || 1),
      };
    })
    .filter((p) => p.slug);
}

function ComprarPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const entries = parseProducts(params.get("products") ?? "");
      const coupon = (params.get("coupon") ?? "").trim();

      if (entries.length === 0) {
        navigate({ to: "/loja" });
        return;
      }

      const fetched = await Promise.all(
        entries.map((e) =>
          getProductBySlug(e.slug)
            .then((p) => ({ p, qty: e.qty }))
            .catch(() => ({ p: null, qty: e.qty })),
        ),
      );
      if (cancelled) return;

      const items: CartItem[] = [];
      for (const { p, qty } of fetched) {
        if (!p) continue;
        items.push({
          product_id: p.id,
          slug: p.slug,
          name: p.name,
          image: p.gallery?.[0]?.url ?? null,
          unit_price_cents: p.price_cents,
          qty,
        });
      }

      if (items.length === 0) {
        setError("Não encontramos esses produtos na loja.");
        return;
      }

      // Substitui o carrinho (a Meta exige que contenha apenas os itens enviados).
      replaceCart(items);
      if (coupon) {
        try {
          window.localStorage.setItem("elisa.coupon.v1", coupon);
        } catch {
          /* ignore */
        }
      }
      navigate({ to: "/carrinho" });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <Layout>
      <section className="py-24 md:py-32 bg-cream min-h-[60vh] flex items-center justify-center">
        <div className="text-center px-6">
          {error ? (
            <>
              <p className="font-display text-2xl text-primary-dark mb-4">{error}</p>
              <Link
                to="/loja"
                className="inline-block px-6 py-3 rounded-full bg-primary text-cream text-sm uppercase tracking-widest hover:opacity-90 transition"
              >
                Ir para a loja
              </Link>
            </>
          ) : (
            <p className="font-display text-2xl text-primary-dark animate-pulse">
              Preparando seu carrinho…
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
}
