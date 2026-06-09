import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Package, ChevronRight, ShoppingBag, X, CheckCircle, Circle, Truck, XCircle, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { listMyOrders, formatPriceBRL, cancelMyOrder, type Order } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/painel/pedidos")({
  validateSearch: (s: Record<string, unknown>) => ({
    highlight: typeof s.highlight === "string" ? s.highlight : undefined,
  }),
  head: () => ({ meta: [{ title: "Meus pedidos — Elisa Hoeppers" }] }),
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const highlightCode = search.highlight;

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
              <OrderRow key={o.id} order={o} isHighlighted={!!highlightCode && o.code === highlightCode} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function OrderRow({ order: o, isHighlighted = false }: { order: Order; isHighlighted?: boolean }) {
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

  const isCancelled = o.status === "cancelled";
  const stages: { key: Order["status"]; label: string; reached: boolean }[] = [
    { key: "pending", label: "Pendente", reached: true },
    { key: "confirmed", label: "Confirmado", reached: ["confirmed", "shipped", "completed"].includes(o.status) },
    { key: "shipped", label: "Enviado", reached: ["shipped", "completed"].includes(o.status) },
    { key: "completed", label: "Entregue", reached: o.status === "completed" },
  ];

  return (
    <div className={`bg-white rounded-lg p-5 hover:shadow-md transition ${isHighlighted ? "ring-2 ring-primary" : ""}`}>
      {isHighlighted && (
        <div className="mb-3 rounded-md bg-primary/10 text-primary text-xs px-3 py-2 font-medium">
          ✓ Pedido criado agora há pouco
        </div>
      )}
      <Link to="/pedido/$code" params={{ code: o.code }} className="block group">
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
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-lg text-primary-dark">{formatPriceBRL(o.total_cents)}</p>
          </div>
          <ChevronRight className="text-primary-dark/30 group-hover:text-primary transition shrink-0" size={20} />
        </div>
      </Link>

      {/* Timeline de status (só se não cancelado) */}
      {!isCancelled && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center">
            {stages.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  {s.reached ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-primary-dark/25" />
                  )}
                  <span className={`mt-1 text-[10px] ${s.reached ? "text-primary" : "text-primary-dark/40"}`}>
                    {s.label}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 -mt-4 ${stages[i + 1].reached ? "bg-primary" : "bg-primary-dark/15"}`} />
                )}
              </div>
            ))}
          </div>

          {o.tracking_code && (
            <div className="mt-4 flex items-center justify-between gap-3 bg-cream rounded-md px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-primary-dark min-w-0">
                <Truck className="w-4 h-4 shrink-0 text-primary" />
                <span className="text-primary-dark/60">Rastreio:</span>
                <span className="font-mono truncate">{o.tracking_code}</span>
              </div>
              <a
                href={`https://rastreamento.correios.com.br/app/index.php?objetos=${o.tracking_code}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary hover:opacity-70 transition shrink-0"
              >
                Rastrear <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {isCancelled && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-red-700 text-sm">
          <XCircle className="w-4 h-4" />
          Pedido cancelado
        </div>
      )}

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
