import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { formatPriceBRL, cancelMyOrder } from "@/lib/shop";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type OrderItem = {
  product_id: string;
  slug: string;
  name: string;
  qty: number;
  unit_price_cents: number;
  total_cents: number;
};
type Order = {
  id: string;
  user_id: string | null;
  code: string;
  customer_name: string;
  items: OrderItem[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  status: string;
  tracking_code: string | null;
  payment_method_type: string | null;
  payment_installments: number | null;
  created_at: string;
  base_invoice_number?: string | null;
  base_invoice_status?: string | null;
  base_invoice_danfe_url?: string | null;
  base_invoice_xml_url?: string | null;
  base_invoice_key?: string | null;
};

function PaymentCountdown({ order }: { order: Order }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (order.status !== "pending" || !order.payment_method_type) return;

    const createdAt = new Date(order.created_at).getTime();
    let expiresAt: number;

    if (order.payment_method_type === "pix") {
      expiresAt = createdAt + 30 * 60 * 1000;
    } else if (order.payment_method_type === "ticket") {
      expiresAt = createdAt + 48 * 60 * 60 * 1000;
    } else {
      return;
    }

    const update = () => {
      const rem = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(rem);
    };

    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [order.status, order.payment_method_type, order.created_at]);

  if (remaining === null) return null;
  if (remaining === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4 text-sm text-red-700">
        ⏰ Pagamento expirou. Refaça o pedido pra tentar de novo.
      </div>
    );
  }

  const isPix = order.payment_method_type === "pix";
  const hrs = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  return (
    <div className="bg-peach/30 border border-peach rounded-md px-4 py-3 mb-4 text-sm text-primary-dark">
      ⏳ {isPix ? "PIX expira em" : "Boleto vence em"}{" "}
      <span className="font-mono font-bold">
        {isPix
          ? `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
          : `${hrs}h ${mins}min`}
      </span>
    </div>
  );
}

export const Route = createFileRoute("/pedido/$code")({
  validateSearch: (s: Record<string, unknown>): { status?: string; email?: string } => ({
    status: typeof s.status === "string" ? s.status : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  loaderDeps: ({ search }) => ({ email: search.email }),
  loader: async ({ params, deps }) => {
    const { data, error } = await supabase.rpc("get_order_by_code", {
      p_code: params.code,
      p_email: deps.email ?? null,
    });
    if (error) throw error;
    const order = Array.isArray(data) ? data[0] : data;
    if (!order) return { order: null as Order | null, needsEmail: true };
    // Enriquece com dados fiscais (RLS aplica; falhas silenciosas)
    try {
      const { data: nfe } = await supabase
        .from("orders")
        .select("base_invoice_number, base_invoice_status, base_invoice_danfe_url, base_invoice_xml_url, base_invoice_key")
        .eq("id", order.id)
        .maybeSingle();
      if (nfe) Object.assign(order, nfe);
    } catch {}
    return { order: order as Order, needsEmail: false };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Pedido${loaderData?.order ? ` #${loaderData.order.code}` : ""} — Elisa Hoeppers` }],
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
  const { order, needsEmail } = Route.useLoaderData();
  const { code } = Route.useParams();
  const search = Route.useSearch();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    // Logado E dona do pedido E pedido criado nos últimos 5 minutos → vai pra lista
    if (order && user && order.user_id && user.id === order.user_id) {
      const createdRecently = new Date(order.created_at).getTime() > Date.now() - 5 * 60 * 1000;
      if (createdRecently && (search.status === "success" || !search.status)) {
        navigate({ to: "/painel/pedidos", search: { highlight: order.code } });
      }
    }
  }, [user, order, search.status, navigate]);

  const cancel = useMutation({
    mutationFn: () => cancelMyOrder(order!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      supabase.functions
        .invoke("send-notification", {
          body: { type: "order_cancelled", record_id: order!.id },
        })
        .catch((e) => console.error("cancel email failed:", e));
      window.location.reload();
    },
  });

  // MP diz sucesso mas order ainda pending → webhook pode estar chegando. Re-checa em 30s.
  useEffect(() => {
    if (search.status === "success" && order && order.status === "pending") {
      const timer = setTimeout(() => window.location.reload(), 30000);
      return () => clearTimeout(timer);
    }
  }, [search.status, order]);



  // Pedido de convidado: pede confirmação de email antes de exibir os dados
  if (!order) {
    return (
      <Layout>
        <section className="py-24 max-w-md mx-auto px-4 text-center">
          <h1 className="font-display text-2xl text-primary-dark mb-4">
            Confirme seu email pra ver o pedido
          </h1>
          <p className="text-[var(--text-muted)] mb-6 text-sm">
            Pra proteger seus dados, confirme o email usado na compra.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
              navigate({ to: "/pedido/$code", params: { code }, search: { email } });
            }}
          >
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full border border-border rounded-md px-3 py-2 mb-3"
            />
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-full uppercase text-xs tracking-widest hover:bg-primary-dark transition"
            >
              Ver pedido
            </button>
          </form>
          <p className="text-xs text-[var(--text-muted)] mt-6">
            Se você é a dona da conta,{" "}
            <Link to="/login" className="text-primary underline">
              faça login
            </Link>{" "}
            pra pular esse passo.
          </p>
        </section>
      </Layout>
    );
  }

  const banner =
    order.status === "confirmed" || order.status === "shipped" || order.status === "completed"
      ? { cls: "bg-primary/10 text-primary-dark border-primary/30", text: "✅ Pagamento confirmado! A Elisa vai processar seu pedido em breve." }
      : search.status === "failure" || order.status === "cancelled"
      ? { cls: "bg-red-50 text-red-700 border-red-200", text: "❌ Pagamento não foi concluído ou pedido cancelado. Tente novamente ou combine via WhatsApp." }
      : null;


  const wppItems = order.items
    .map((i: OrderItem) => `• ${i.qty}× ${i.name} — ${formatPriceBRL(i.total_cents)}`)
    .join("%0A");
  const wppMsg = `Oi Elisa! Acabei de fazer o pedido %23${order.code}.%0A%0A${wppItems}%0A%0ATotal: ${formatPriceBRL(order.total_cents)}%0A%0AMe avisa como combinamos frete e pagamento, por favor!`;
  const wppLink = `https://wa.me/5511994061178?text=${wppMsg}`;

  const isOwner = !!user && !!order.user_id && user.id === order.user_id;
  const isGuestOrder = !order.user_id && !user;





  return (
    <Layout>
      <section className="py-16 md:py-24 bg-cream min-h-screen">
        <div className="max-w-[720px] mx-auto px-4 md:px-6">
          {order.status === "confirmed" && order.payment_method_type === "credit_card" && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mb-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="font-display text-2xl text-primary-dark mb-2">
                Pagamento aprovado!
              </h2>
              <p className="text-sm text-primary-dark/70">
                Pago com cartão{order.payment_installments && order.payment_installments > 1 ? ` em ${order.payment_installments}×` : ""}. Você recebeu confirmação por email.
              </p>
            </div>
          )}
          {order.status === "pending" && order.payment_method_type === "credit_card" && (
            <div className="bg-peach/30 border border-peach rounded-xl p-6 mb-6 text-center">
              <div className="text-4xl mb-3">⏳</div>
              <h2 className="font-display text-2xl text-primary-dark mb-2">
                Processando pagamento
              </h2>
              <p className="text-sm text-primary-dark/70">
                Confirmando com a operadora do cartão. Isso costuma levar alguns segundos.
              </p>
            </div>
          )}
          {order.status === "cancelled" && order.payment_method_type === "credit_card" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-center">
              <div className="text-4xl mb-3">❌</div>
              <h2 className="font-display text-2xl text-primary-dark mb-2">
                Pagamento não aprovado
              </h2>
              <p className="text-sm text-primary-dark/70 mb-4">
                Seu cartão foi recusado pela operadora. Tente novamente com outro cartão ou use PIX.
              </p>
              <Link
                to="/loja"
                className="inline-block bg-primary text-cream px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition"
              >
                Voltar pra loja
              </Link>
            </div>
          )}
          {order.status === "pending" && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-3 flex-wrap">
              <span>Seu pedido ainda não foi pago.</span>
              <Link
                to="/pagamento/$code"
                params={{ code: order.code }}
                className="inline-block bg-primary text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition"
              >
                Finalizar pagamento
              </Link>
            </div>
          )}
          {banner && (
            <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${banner.cls}`}>
              {banner.text}
            </div>
          )}
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
            <div className="pt-4 mt-4 border-t border-border space-y-1.5">
              <div className="flex justify-between text-sm text-[var(--text-muted)]">
                <span>Subtotal</span>
                <span>{formatPriceBRL(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-muted)]">
                <span>Frete</span>
                <span>
                  {order.shipping_cents > 0
                    ? formatPriceBRL(order.shipping_cents)
                    : "a combinar por WhatsApp"}
                </span>
              </div>
              <div className="flex justify-between pt-2 mt-1 border-t border-border">
                <span className="font-display text-lg text-primary-dark">Total</span>
                <span className="font-display text-2xl text-primary-dark">
                  {formatPriceBRL(order.total_cents)}
                </span>
              </div>
            </div>

          </div>

          <a
            href={wppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-4 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-[#1faa52] transition"
          >
            <MessageCircle className="w-4 h-4" /> Falar com a Elisa no WhatsApp
          </a>

          {isOwner && order.status === "pending" && (
            <button
              onClick={() => {
                if (confirm("Cancelar este pedido?")) cancel.mutate();
              }}
              disabled={cancel.isPending}
              className="block mx-auto mt-3 text-xs uppercase tracking-widest text-red-700 hover:opacity-70 transition disabled:opacity-50"
            >
              {cancel.isPending ? "Cancelando..." : "Cancelar pedido"}
            </button>
          )}

          {order.base_invoice_danfe_url && (
            <div className="mt-6 bg-white rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2 text-center">
                Nota Fiscal (NFe)
              </p>
              {order.base_invoice_number && (
                <p className="text-center text-sm text-primary-dark mb-3">
                  NFe nº <span className="font-mono">{order.base_invoice_number}</span>
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={order.base_invoice_danfe_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-cream px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition"
                >
                  📄 Baixar DANFE
                </a>
                {order.base_invoice_xml_url && (
                  <a
                    href={order.base_invoice_xml_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-primary text-primary px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-cream transition"
                  >
                    XML
                  </a>
                )}
              </div>
            </div>
          )}



          {order.tracking_code && (order.status === "shipped" || order.status === "completed") && (
            <div className="mt-6 bg-white rounded-lg p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Código de rastreio
              </p>
              <p className="font-mono text-lg text-primary-dark mb-2">{order.tracking_code}</p>
              <a
                href={`https://rastreamento.correios.com.br/app/index.php?objeto=${order.tracking_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Acompanhar nos Correios →
              </a>
            </div>
          )}

          {isGuestOrder && (
            <div className="mt-6 bg-white rounded-lg p-6 text-center">
              <p className="font-display text-lg text-primary-dark">
                Quer acompanhar todos os seus pedidos num só lugar?
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-2 mb-4">
                Crie sua conta gratuita com o mesmo email do pedido pra ver tudo no seu painel.
              </p>
              <Link
                to="/p/$slug"
                params={{ slug: "cadastro-de-alunos" }}
                className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
              >
                Criar conta agora
              </Link>
            </div>
          )}

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

