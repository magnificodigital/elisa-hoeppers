import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Package, Mail, Phone, MessageCircle, MapPin, Calendar } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { listAllOrdersForAdmin, updateOrderStatus, updateOrderShipping, updateOrderTracking, formatPriceBRL, type Order } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({ meta: [{ title: "Admin — Pedidos" }] }),
  component: () => (
    <AdminGuard>
      <AdminOrders />
    </AdminGuard>
  ),
});

const FILTERS = [
  { id: "pending", label: "Pendentes" },
  { id: "confirmed", label: "Confirmados" },
  { id: "shipped", label: "Enviados" },
  { id: "completed", label: "Concluídos" },
  { id: "cancelled", label: "Cancelados" },
  { id: "all", label: "Todos" },
] as const;

type FilterId = typeof FILTERS[number]["id"];

function AdminOrders() {
  const [filter, setFilter] = useState<FilterId>("pending");
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => listAllOrdersForAdmin(filter === "all" ? {} : { status: filter as Order["status"] }),
  });
  const { data: pendingCount } = useQuery({
    queryKey: ["admin-orders-pending-count"],
    queryFn: () => listAllOrdersForAdmin({ status: "pending" }),
  });

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-[var(--surface-cream)] min-h-screen">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-7 h-7 text-primary" />
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Pedidos</h1>
            {(pendingCount?.length ?? 0) > 0 && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-peach/40 text-primary-dark">
                {pendingCount!.length} pendente{pendingCount!.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="text-[var(--text-muted)] mb-6 text-sm">Gerencie os pedidos da loja.</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                  filter === f.id ? "bg-primary text-white" : "bg-white text-primary-dark border border-border hover:border-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          {!isLoading && (orders?.length ?? 0) === 0 && (
            <div className="bg-white rounded-lg p-10 text-center">
              <p className="text-[var(--text-muted)]">Nenhum pedido neste filtro.</p>
            </div>
          )}

          <div className="space-y-4">
            {(orders ?? []).map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function OrderCard({ order: o }: { order: Order }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [shippingInput, setShippingInput] = useState((o.shipping_cents / 100).toFixed(2).replace(".", ","));
  const [trackingInput, setTrackingInput] = useState(o.tracking_code ?? "");

  const updateTracking = useMutation({
    mutationFn: () => updateOrderTracking(o.id, trackingInput.trim() || null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const updateStatus = useMutation({
    mutationFn: (status: Order["status"]) => updateOrderStatus(o.id, status),
    onSuccess: (_data, status) => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-orders-pending-count"] });
      if (status === "shipped") {
        supabase.functions
          .invoke("send-notification", { body: { type: "order_shipped", record_id: o.id } })
          .catch((e) => console.error("shipped email failed:", e));
      } else if (status === "completed") {
        supabase.functions
          .invoke("send-notification", { body: { type: "order_completed", record_id: o.id } })
          .catch((e) => console.error("completed email failed:", e));
      }
    },
  });

  const updateShipping = useMutation({
    mutationFn: () => {
      const cents = Math.round(parseFloat(shippingInput.replace(",", ".")) * 100) || 0;
      return updateOrderShipping(o.id, cents, o.subtotal_cents);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });


  const cleanPhone = o.customer_phone.replace(/\D/g, "");
  const wppNumber = cleanPhone.length >= 10 ? (cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`) : null;
  const wppMessage = encodeURIComponent(
    `Oi ${o.customer_name.split(" ")[0]}! Recebi seu pedido #${o.code}. Total: ${formatPriceBRL(o.total_cents)}. Vamos combinar frete e pagamento?`
  );

  return (
    <div className="bg-white rounded-lg p-5 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-sm text-primary-dark">#{o.code}</span>
            <StatusPill status={o.status} />
            <span className="text-[11px] text-[var(--text-muted)] inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(o.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <h3 className="font-medium text-primary-dark">{o.customer_name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {o.customer_email}</span>
            <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {o.customer_phone}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-2xl text-primary-dark">{formatPriceBRL(o.total_cents)}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{o.items.length} {o.items.length === 1 ? "item" : "itens"}</p>
        </div>
      </div>

      <div className="bg-cream/60 rounded-md p-3 mb-3 text-sm">
        {o.items.map((it, i) => (
          <div key={i} className="flex justify-between py-0.5">
            <span className="text-primary-dark">{it.qty}× {it.name}</span>
            <span className="text-[var(--text-muted)]">{formatPriceBRL(it.total_cents)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 mt-2 border-t border-border text-xs">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <span className="text-primary-dark">{formatPriceBRL(o.subtotal_cents)}</span>
        </div>
        {o.shipping_cents > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Frete</span>
            <span className="text-primary-dark">{formatPriceBRL(o.shipping_cents)}</span>
          </div>
        )}
      </div>

      <button onClick={() => setExpanded(!expanded)} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 mb-3">
        {expanded ? "− Ocultar detalhes" : "+ Ver detalhes"}
      </button>

      {expanded && (
        <div className="space-y-3 mb-4 text-sm">
          {o.customer_address && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary-dark mb-1 inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Endereço
              </p>
              <p className="text-primary-dark/80">
                {[o.customer_address.street, o.customer_address.number, o.customer_address.complement, o.customer_address.district, o.customer_address.city ? `${o.customer_address.city}/${o.customer_address.state ?? ""}` : null, o.customer_address.cep]
                  .filter(Boolean).join(", ")}
              </p>
            </div>
          )}
          {o.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary-dark mb-1">Observações</p>
              <p className="text-primary-dark/80 italic">"{o.notes}"</p>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-dark mb-1">Frete (R$)</p>
            <div className="flex gap-2">
              <input value={shippingInput} onChange={(e) => setShippingInput(e.target.value)} placeholder="0,00"
                className="flex-1 border border-border rounded-md px-3 py-1.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={() => updateShipping.mutate()} disabled={updateShipping.isPending}
                className="bg-primary text-white px-4 py-1.5 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
                {updateShipping.isPending ? "..." : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
        {wppNumber && (
          <a href={`https://wa.me/${wppNumber}?text=${wppMessage}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:opacity-90 transition">
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        )}
        {o.status === "pending" && (
          <>
            <button onClick={() => updateStatus.mutate("confirmed")} className="bg-primary text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition">
              Confirmar
            </button>
            <button onClick={() => { if (confirm("Cancelar pedido?")) updateStatus.mutate("cancelled"); }}
              className="border border-border text-[var(--text-muted)] px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-cream/60 transition">
              Cancelar
            </button>
          </>
        )}
        {o.status === "confirmed" && (
          <>
            <button onClick={() => updateStatus.mutate("shipped")} className="bg-primary text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition">
              Marcar enviado
            </button>
            <button onClick={() => { if (confirm("Cancelar pedido?")) updateStatus.mutate("cancelled"); }}
              className="border border-border text-[var(--text-muted)] px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-cream/60 transition">
              Cancelar
            </button>
          </>
        )}
        {o.status === "shipped" && (
          <button onClick={() => updateStatus.mutate("completed")} className="bg-primary-dark text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:opacity-90 transition">
            Marcar concluído
          </button>
        )}
        {o.status === "cancelled" && (
          <button onClick={() => updateStatus.mutate("pending")} className="border border-border text-primary-dark px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-cream/60 transition">
            Reabrir
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Order["status"] }) {
  const map = {
    pending: { label: "Pendente", cls: "bg-peach/40 text-primary-dark" },
    confirmed: { label: "Confirmado", cls: "bg-primary/10 text-primary" },
    shipped: { label: "Enviado", cls: "bg-primary-dark/10 text-primary-dark" },
    completed: { label: "Concluído", cls: "bg-primary-dark/10 text-primary-dark" },
    cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
  } as const;
  const m = map[status];
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
}
