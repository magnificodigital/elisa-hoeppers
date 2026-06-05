import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Package, ChevronRight, ShoppingBag, X } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { listMyOrders, formatPriceBRL, cancelMyOrder, type Order } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/painel/pedidos")({
  head: () => ({ meta: [{ title: "Meus pedidos — Elisa Hoeppers" }] }),
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: "/painel/pedidos" } });
  }, [loading, user, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: listMyOrders,
    enabled: !!user,
  });

  if (loading || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark">Carregando…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/painel" className="text-xs uppercase tracking-widest text-primary-dark/60 hover:text-primary-dark mb-4 inline-block">
            ← Voltar ao painel
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-primary" size={28} />
            <h1 className="font-display text-3xl text-primary-dark">Meus pedidos</h1>
          </div>
          <p className="text-primary-dark/60 mb-8">Histórico de compras na loja.</p>

          {isLoading && <p className="text-primary-dark/70">Carregando…</p>}

          {!isLoading && (orders?.length ?? 0) === 0 && (
            <div className="bg-white rounded-lg p-10 text-center">
              <ShoppingBag className="mx-auto mb-4 text-primary-dark/30" size={40} />
              <p className="text-primary-dark mb-6">Você ainda não fez nenhum pedido.</p>
              <Link
                to="/loja"
                className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
              >
                Explorar loja
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {(orders ?? []).map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function OrderRow({ order: o }: { order: Order }) {
  const qc = useQueryClient();
  const totalQty = o.items.reduce((acc, i) => acc + i.qty, 0);

  const cancel = useMutation({
    mutationFn: () => cancelMyOrder(o.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      supabase.functions
        .invoke("send-notification", {
          body: { type: "order_cancelled", record_id: o.id },
        })
        .catch((e) => console.error("cancel email failed:", e));
    },
  });

  return (
    <div className="bg-white rounded-lg p-5 hover:shadow-md transition">
      <Link
        to="/pedido/$code"
        params={{ code: o.code }}
        className="block group"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span className="font-mono font-semibold text-primary-dark">#{o.code}</span>
              <StatusPill status={o.status} />
              <span className="text-xs text-primary-dark/50">
                {new Date(o.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <p className="text-sm text-primary-dark/70 truncate">
              {o.items.length === 1
                ? `${o.items[0].qty}× ${o.items[0].name}`
                : `${o.items.length} produtos · ${totalQty} ${totalQty === 1 ? "item" : "itens"}`}
            </p>
            {o.tracking_code && (o.status === "shipped" || o.status === "completed") && (
              <p className="text-xs text-primary-dark/60 mt-1 font-mono">
                Rastreio: {o.tracking_code}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-lg text-primary-dark">{formatPriceBRL(o.total_cents)}</p>
          </div>
          <ChevronRight className="text-primary-dark/30 group-hover:text-primary transition shrink-0" size={20} />
        </div>
      </Link>

      {o.status === "pending" && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => {
              if (confirm("Cancelar este pedido? Você ainda pode refazer depois.")) cancel.mutate();
            }}
            disabled={cancel.isPending}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-red-700 hover:opacity-70 transition disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            {cancel.isPending ? "Cancelando..." : "Cancelar pedido"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Order["status"] }) {
  const map = {
    pending: { label: "Pendente", cls: "bg-peach/40 text-primary-dark" },
    confirmed: { label: "Confirmado", cls: "bg-primary/10 text-primary" },
    shipped: { label: "Enviado", cls: "bg-accent-teal/15 text-accent-teal" },
    completed: { label: "Concluído", cls: "bg-primary-dark/10 text-primary-dark" },
    cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
  } as const;
  const m = map[status];
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}
