import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, MessageCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { formatPriceBRL } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  product_id: string;
  slug: string;
  name: string;
  qty: number;
  unit_price_cents: number;
  total_cents: number;
};
type Order = {
  code: string;
  customer_name: string;
  items: OrderItem[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/pedido/$code")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: typeof s.status === "string" ? s.status : undefined,
  }),
  loader: async ({ params }) => {
    const { data, error } = await supabase.rpc("get_order_by_code", { p_code: params.code });
    if (error) throw error;
    const order = Array.isArray(data) ? data[0] : data;
    if (!order) throw notFound();
    return { order: order as Order };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Pedido #${loaderData?.order.code} — Elisa Hoeppers` }],
  }),
  notFoundComponent: () => (
    <Layout>
      <div className="max-w-[800px] mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-primary-dark mb-4">Pedido não encontrado</h1>
        <Link to="/loja" className="text-primary underline">
          Voltar pra loja
        </Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout>
      <div className="max-w-[800px] mx-auto px-4 py-24 text-center">
        <p className="text-primary-dark">{error.message}</p>
      </div>
    </Layout>
  ),
  component: OrderPage,
});

function OrderPage() {
  const { order } = Route.useLoaderData();
  const search = Route.useSearch();
  const banner =
    search.status === "success"
      ? { cls: "bg-primary/10 text-primary-dark border-primary/30", text: "✅ Pagamento aprovado! A Elisa vai entrar em contato pra combinar o envio." }
      : search.status === "pending"
      ? { cls: "bg-peach/40 text-primary-dark border-peach", text: "⏳ Pagamento em processamento. PIX cai em minutos, boleto pode levar até 2 dias úteis." }
      : search.status === "failure"
      ? { cls: "bg-red-50 text-red-700 border-red-200", text: "❌ Pagamento não foi concluído. Tente novamente ou combine via WhatsApp." }
      : null;

  const wppItems = order.items
    .map((i: OrderItem) => `• ${i.qty}× ${i.name} — ${formatPriceBRL(i.total_cents)}`)
    .join("%0A");
  const wppMsg = `Oi Elisa! Acabei de fazer o pedido %23${order.code}.%0A%0A${wppItems}%0A%0ATotal: ${formatPriceBRL(order.total_cents)}%0A%0AMe avisa como combinamos frete e pagamento, por favor!`;
  const wppLink = `https://wa.me/5547999999999?text=${wppMsg}`;

  return (
    <Layout>
      <section className="py-16 md:py-24 bg-cream min-h-screen">
        <div className="max-w-[720px] mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto bg-primary text-white rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-primary-dark">
              Pedido recebido!
            </h1>
            <p className="text-[var(--text-muted)] mt-3">
              Seu código é{" "}
              <span className="text-primary-dark font-medium">#{order.code}</span>
            </p>
            <p className="text-[var(--text-muted)] mt-1 text-sm">
              Olá, {order.customer_name.split(" ")[0]}! A Elisa vai entrar em contato em até
              24h.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="font-display text-xl text-primary-dark mb-4">Itens</h2>
            <ul className="space-y-3">
              {order.items.map((it: OrderItem) => (
                <li
                  key={it.product_id}
                  className="flex justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      to="/loja/$slug"
                      params={{ slug: it.slug }}
                      className="text-primary-dark font-medium hover:text-primary"
                    >
                      {it.name}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {it.qty}× {formatPriceBRL(it.unit_price_cents)}
                    </p>
                  </div>
                  <p className="font-display text-primary-dark flex-shrink-0">
                    {formatPriceBRL(it.total_cents)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex justify-between pt-4 mt-4 border-t border-border">
              <span className="font-display text-lg text-primary-dark">Total</span>
              <span className="font-display text-2xl text-primary-dark">
                {formatPriceBRL(order.total_cents)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3 italic">
              Frete combinado por WhatsApp
            </p>
          </div>

          <a
            href={wppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-4 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-[#1faa52] transition"
          >
            <MessageCircle className="w-4 h-4" /> Falar com a Elisa no WhatsApp
          </a>
          <Link
            to="/loja"
            className="block text-center mt-4 text-sm text-primary-dark hover:text-primary"
          >
            Voltar pra loja
          </Link>
        </div>
      </section>
    </Layout>
  );
}
