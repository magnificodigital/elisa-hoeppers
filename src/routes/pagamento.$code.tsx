import { createFileRoute, notFound, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { formatPriceBRL } from "@/lib/shop";
import { MpPaymentBrick } from "@/components/checkout/MpPaymentBrick";
import { getSetting } from "@/lib/settings";
import { toast } from "sonner";

export const Route = createFileRoute("/pagamento/$code")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, code, customer_name, customer_email, items, subtotal_cents, shipping_cents, total_cents, status, mp_preference_id")
      .eq("code", params.code)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return { order: data };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Pagamento #${loaderData?.order.code} — BODYOGA` }],
  }),
  notFoundComponent: () => (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-primary-dark mb-4">Pedido não encontrado</h1>
        <Link to="/loja" className="text-primary underline">Voltar pra loja</Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-primary-dark">{error.message}</p>
      </div>
    </Layout>
  ),
  component: PagamentoPage,
});

function PagamentoPage() {
  const { order } = Route.useLoaderData();
  const navigate = useNavigate();
  const [publicKey, setPublicKey] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSetting("mp_public_key").then((v) => v && setPublicKey(v)).catch(() => {});
  }, []);

  useEffect(() => {
    if (order.status === "confirmed" || order.status === "shipped" || order.status === "completed") {
      navigate({ to: "/pedido/$code", params: { code: order.code } });
    }
  }, [order.status, order.code, navigate]);

  if (!order.mp_preference_id) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl text-primary-dark mb-2">Pagamento não iniciado</h1>
          <p className="text-primary-dark/70 mb-6">Refaça o pedido pra criar o pagamento.</p>
          <Link to="/loja" className="text-primary underline">Voltar pra loja</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            to="/checkout"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary-dark/60 hover:text-primary-dark mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar
          </Link>

          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">
            Pagamento
          </h1>
          <p className="text-primary-dark/70 mb-6">
            Pedido <span className="font-mono">#{order.code}</span> · Total {formatPriceBRL(order.total_cents)}
          </p>

          <div className="bg-white rounded-lg p-4 mb-6 border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-dark/70">
                {(order.items as any[]).length} item(s) · Frete {formatPriceBRL(order.shipping_cents ?? 0)}
              </span>
              <span className="font-display text-lg text-primary-dark">{formatPriceBRL(order.total_cents)}</span>
            </div>
          </div>

          {publicKey ? (
            <div className="bg-white rounded-lg p-4 border border-border">
              <MpPaymentBrick
                publicKey={publicKey}
                preferenceId={order.mp_preference_id!}
                amountCents={order.total_cents}
                orderCode={order.code}
                payerEmail={order.customer_email ?? undefined}
                onSuccess={(_paymentId) => {
                  clear();
                  toast.success("Pagamento aprovado!");
                  navigate({
                    to: "/pedido/$code",
                    params: { code: order.code },
                    search: { status: "success" } as any,
                  });
                }}
                onPending={() => {
                  clear();
                  navigate({ to: "/pedido/$code", params: { code: order.code } });
                }}
                onError={(msg) => setError(msg)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-primary-dark/70">Carregando forma de pagamento...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-primary-dark/60">
            <ShieldCheck className="w-4 h-4" />
            Pagamento processado com segurança pelo Mercado Pago
          </div>
        </div>
      </section>
    </Layout>
  );
}
