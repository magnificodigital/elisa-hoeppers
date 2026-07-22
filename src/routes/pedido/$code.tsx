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
  asaas_pix_qr_code_image?: string | null;
  asaas_pix_qr_code_copy_paste?: string | null;
  asaas_pix_expires_at?: string | null;
  asaas_invoice_url?: string | null;
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
  validateSearch: (s: Record<string, unknown>) => ({
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
      : search.status === "pending" || (search.status === "success" && order.status === "pending")
      ? { cls: "bg-peach/40 text-primary-dark border-peach", text: "⏳ Confirmando pagamento com o Mercado Pago... Isso pode levar até 2 minutos." }
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
          {order.status === "pending" && order.asaas_pix_qr_code_image && (
            <PixPaymentBlock order={order} />
          )}
          {order.status === "pending" && !order.asaas_pix_qr_code_image && order.payment_method_type !== "credit_card" && <PaymentCountdown order={order} />}
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
                to="/cadastro-de-alunos"
                search={{ email: undefined }}
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

function PixPaymentBlock({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  // Polling: recarrega a página a cada 8s pra pegar confirmação do webhook
  useEffect(() => {
    const timer = setInterval(() => {
      window.location.reload();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!order.asaas_pix_expires_at) return;
    const update = () => {
      const remaining = new Date(order.asaas_pix_expires_at as string).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown("Expirado");
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${mins}:${String(secs).padStart(2, "0")}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [order.asaas_pix_expires_at]);

  function copy() {
    if (!order.asaas_pix_qr_code_copy_paste) return;
    navigator.clipboard.writeText(order.asaas_pix_qr_code_copy_paste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-primary/30 p-6 mb-6">
      <div className="text-center mb-4">
        <h2 className="font-display text-2xl text-primary-dark mb-1">Pague com PIX</h2>
        <p className="text-sm text-primary-dark/70">
          Escaneie o QR code ou copie o código pra pagar no app do seu banco
        </p>
        {countdown && (
          <p className="text-xs text-primary-dark/60 mt-2">
            Expira em <span className="font-mono font-medium">{countdown}</span>
          </p>
        )}
      </div>

      <div className="flex justify-center mb-4">
        <img
          src={`data:image/png;base64,${order.asaas_pix_qr_code_image}`}
          alt="QR Code PIX"
          className="w-64 h-64 border border-border rounded-lg"
        />
      </div>

      <button
        onClick={copy}
        className="w-full bg-primary text-cream py-3 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition"
      >
        {copied ? "✓ Copiado!" : "Copiar código PIX"}
      </button>

      <div className="mt-4 p-3 bg-cream/60 rounded-lg">
        <p className="text-[10px] uppercase tracking-widest text-primary-dark/60 mb-1">
          Código copia e cola
        </p>
        <p className="text-xs font-mono text-primary-dark break-all leading-relaxed">
          {order.asaas_pix_qr_code_copy_paste}
        </p>
      </div>

      <p className="text-xs text-primary-dark/60 text-center mt-4">
        📱 Assim que pagar, a página atualiza automaticamente
      </p>
    </div>
  );
}
