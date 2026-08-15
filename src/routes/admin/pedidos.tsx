import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Package, Mail, Phone, MessageCircle, MapPin, Calendar, Truck, FileText } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PaymentMethodBadge } from "@/components/PaymentMethodBadge";
import { useNewOrderNotifications } from "@/hooks/useNewOrderNotifications";
import { centsToBRL, formatBRLInput } from "@/lib/currency";
import { listAllOrdersForAdmin, updateOrderStatus, updateOrderShipping, updateOrderTracking, formatPriceBRL, type Order } from "@/lib/shop";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/pedidos")({
  head: () => ({ meta: [{ title: "Admin — Pedidos" }] }),
  component: () => <AdminOrders />,
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
  useNewOrderNotifications();
  const [filter, setFilter] = useState<FilterId>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => listAllOrdersForAdmin(filter === "all" ? {} : { status: filter as Order["status"] }),
  });
  const { data: pendingCount } = useQuery({
    queryKey: ["admin-orders-pending-count"],
    queryFn: () => listAllOrdersForAdmin({ status: "pending" }),
  });

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders ?? [];
    return (orders ?? []).filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_email.toLowerCase().includes(q) ||
        (o.customer_phone ?? "").toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return (
    <div className="bg-background min-h-screen">
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
                  filter === f.id ? "bg-primary text-white" : "bg-white text-primary-dark border border-border/20 hover:border-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código, nome, email ou telefone..."
              className="w-full border border-border/20 rounded-full px-5 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <p className="text-xs text-primary-dark/60 mt-2">
                {filteredOrders.length} resultado{filteredOrders.length === 1 ? "" : "s"} pra "{searchQuery}"
              </p>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="sticky top-16 z-10 mb-4 bg-primary text-cream rounded-lg px-5 py-3 flex items-center justify-between flex-wrap gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} pedido{selectedIds.size === 1 ? "" : "s"} selecionado{selectedIds.size === 1 ? "" : "s"}
                </span>
                <button onClick={clearSelection} className="text-xs uppercase tracking-widest text-cream/80 hover:text-cream">
                  Limpar
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <BulkApproveButton ids={Array.from(selectedIds)} onDone={clearSelection} orders={filteredOrders} />
                <BulkBuyLabelsButton ids={Array.from(selectedIds)} onDone={clearSelection} orders={filteredOrders} />
              </div>
            </div>
          )}

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          {!isLoading && filteredOrders.length === 0 && (
            <div className="bg-white border border-border/20 rounded-lg p-10 text-center">
              <p className="text-[var(--text-muted)]">Nenhum pedido neste filtro.</p>
            </div>
          )}

          <div className="space-y-4">
            {filteredOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                isSelected={selectedIds.has(o.id)}
                onToggleSelect={() => toggleSelect(o.id)}
              />
            ))}
          </div>
      </div>
    </div>
  );
}

function BulkApproveButton({ ids, onDone, orders }: { ids: string[]; onDone: () => void; orders: Order[] }) {
  const qc = useQueryClient();
  const eligibleIds = orders.filter((o) => ids.includes(o.id) && o.status === "pending").map((o) => o.id);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").update({ status: "confirmed" }).in("id", eligibleIds);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${eligibleIds.length} pedido(s) aprovado(s)`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-orders-pending-count"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (eligibleIds.length === 0) return null;
  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="inline-flex items-center gap-1.5 bg-background text-primary-dark px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:opacity-90 transition disabled:opacity-60"
    >
      ✓ Aprovar {eligibleIds.length} pendente(s)
    </button>
  );
}

function BulkBuyLabelsButton({ ids, onDone, orders }: { ids: string[]; onDone: () => void; orders: Order[] }) {
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const eligible = orders.filter(
    (o) => ids.includes(o.id) && o.status === "confirmed" && o.shipping_service_id && !o.me_order_id
  );
  const totalCents = eligible.reduce((acc, o) => acc + (o.shipping_cents ?? 0), 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        eligible.map((o) => supabase.functions.invoke("me-buy-label", { body: { order_id: o.id } }))
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      return { ok, fail };
    },
    onSuccess: ({ ok, fail }) => {
      if (fail === 0) {
        toast.success(`${ok} etiqueta(s) comprada(s) com sucesso`);
      } else {
        toast.warning(`${ok} sucesso, ${fail} falha(s). Confira o admin.`);
      }
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (eligible.length === 0) return null;
  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center gap-1.5 bg-background text-primary-dark px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:opacity-90 transition"
      >
        🏷 Comprar {eligible.length} etiqueta(s)
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Comprar ${eligible.length} etiqueta(s)?`}
        description={`Vai debitar ${centsToBRL(totalCents)} do saldo Melhor Envio. Etiquetas processadas em paralelo — em caso de falha em alguma, outras continuam.`}
        confirmLabel="Comprar todas"
        variant="default"
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}


function OrderCard({ order: o, isSelected, onToggleSelect }: { order: Order; isSelected: boolean; onToggleSelect: () => void }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [shippingDisplay, setShippingDisplay] = useState(o.shipping_cents ? centsToBRL(o.shipping_cents) : "");
  const [shippingCents, setShippingCents] = useState(o.shipping_cents);
  const [trackingInput, setTrackingInput] = useState(o.tracking_code ?? "");

  function handleShippingChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { display, cents } = formatBRLInput(e.target.value);
    setShippingDisplay(display);
    setShippingCents(cents);
  }

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
    mutationFn: (cents: number) => updateOrderShipping(o.id, cents, o.subtotal_cents),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const buyLabel = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("me-buy-label", { body: { order_id: o.id } });
      if (error) throw error;
      if ((data as { error?: string }).error) throw new Error((data as { error: string }).error);
      return data as { ok: boolean; me_order_id: string; label_url: string; tracking_code: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-orders-pending-count"] });
    },
  });

  const emitNfe = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("base-emit-invoice", { body: { order_id: o.id } });
      if (error) throw error;
      if ((data as { error?: string }).error) throw new Error((data as { error: string }).error);
      return data;
    },
    onSuccess: () => {
      toast.success("Emissão de NFe iniciada. O status atualiza pelo webhook.");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });




  const cleanPhone = o.customer_phone.replace(/\D/g, "");
  const wppNumber = cleanPhone.length >= 10 ? (cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`) : null;
  const wppMessage = encodeURIComponent(
    `Oi ${o.customer_name.split(" ")[0]}! Recebi seu pedido #${o.code}. Total: ${formatPriceBRL(o.total_cents)}. Vamos combinar frete e pagamento?`
  );

  return (
    <div className={`bg-white border border-border/20 rounded-lg p-5 md:p-6 shadow-none transition ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-start gap-3 mb-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 shrink-0"
        />
      <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-sm text-primary-dark">#{o.code}</span>
            <StatusPill status={o.status} />
            <PaymentMethodBadge type={o.payment_method_type} installments={o.payment_installments} />
            {o.base_invoice_status && <NfeStatusPill status={o.base_invoice_status} />}



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
      </div>

      <div className="bg-background/60 rounded-md p-3 mb-3 text-sm">
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
              <input value={shippingDisplay} onChange={handleShippingChange} placeholder="R$ 0,00"
                className="flex-1 border border-border rounded-md px-3 py-1.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={() => updateShipping.mutate(shippingCents)} disabled={updateShipping.isPending || shippingCents === o.shipping_cents}
                className="bg-primary text-white px-4 py-1.5 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
                {updateShipping.isPending ? "..." : "Aplicar"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary-dark mb-1">Código de rastreio (Correios)</p>
            <div className="flex gap-2">
              <input value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="Ex: BR123456789BR"
                className="flex-1 border border-border rounded-md px-3 py-1.5 bg-white text-primary-dark text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={() => updateTracking.mutate()} disabled={updateTracking.isPending}
                className="bg-primary text-white px-4 py-1.5 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
                {updateTracking.isPending ? "..." : "Salvar"}
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Defina antes de marcar como "Enviado" — vai no email da cliente.</p>
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
              className="border border-border text-[var(--text-muted)] px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-background/60 transition">
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
              className="border border-border text-[var(--text-muted)] px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-background/60 transition">
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
          <button onClick={() => updateStatus.mutate("pending")} className="border border-border text-primary-dark px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-background/60 transition">
            Reabrir
          </button>
        )}

        {o.me_status?.startsWith("failed_") && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-xs text-red-700">
            ⚠️ Última tentativa falhou em <strong>{o.me_status.replace("failed_at_", "")}</strong>.
            {o.me_order_id && ` Order ID no ME: ${o.me_order_id}.`} Você pode tentar de novo,
            ou verificar no painel ME manualmente.
          </div>
        )}

        {o.status === "confirmed" && o.shipping_service_id && (!o.me_order_id || o.me_status?.startsWith("failed_")) && (
          <button
            onClick={() => {
              if (confirm(`Comprar etiqueta? Vai debitar ${formatPriceBRL(o.shipping_cents)} do saldo Melhor Envio.`)) buyLabel.mutate();
            }}
            disabled={buyLabel.isPending}
            className="inline-flex items-center gap-1.5 bg-primary-dark text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:opacity-90 transition disabled:opacity-60"
          >
            <Truck className="w-3.5 h-3.5" />
            {buyLabel.isPending
              ? "Comprando..."
              : o.me_status?.startsWith("failed_")
              ? "Tentar etiqueta ME de novo"
              : "Comprar etiqueta ME"}
          </button>
        )}


        {o.me_label_url && (
          <a href={o.me_label_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-primary text-primary px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition">
            <FileText className="w-3.5 h-3.5" /> Baixar etiqueta
          </a>
        )}

        {o.base_invoice_danfe_url && (
          <a href={o.base_invoice_danfe_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-primary text-primary px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition">
            <FileText className="w-3.5 h-3.5" /> DANFE
          </a>
        )}

        {(o.status === "confirmed" || o.status === "shipped" || o.status === "completed") &&
          (!o.base_invoice_status || o.base_invoice_status === "ERRO") && (
          <button
            onClick={() => emitNfe.mutate()}
            disabled={emitNfe.isPending}
            className="inline-flex items-center gap-1.5 bg-primary-dark text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:opacity-90 transition disabled:opacity-60"
          >
            <FileText className="w-3.5 h-3.5" />
            {emitNfe.isPending ? "Emitindo..." : o.base_invoice_status === "ERRO" ? "Reemitir NFe" : "Emitir NFe"}
          </button>
        )}

        {o.base_invoice_error && (
          <p className="w-full text-red-700 text-xs mt-1">NFe: {o.base_invoice_error}</p>
        )}

        {buyLabel.error && (
          <p className="w-full text-red-700 text-xs mt-1">{(buyLabel.error as Error).message}</p>
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

function NfeStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    AUTORIZADA: { label: "NFe ✓", cls: "bg-primary/10 text-primary" },
    PROCESSANDO: { label: "NFe ...", cls: "bg-peach/40 text-primary-dark" },
    CRIADA: { label: "NFe ...", cls: "bg-peach/40 text-primary-dark" },
    ERRO: { label: "NFe ✗", cls: "bg-red-100 text-red-700" },
    CANCELADA: { label: "NFe canc.", cls: "bg-gray-200 text-gray-700" },
  };
  const m = map[status] ?? { label: `NFe ${status}`, cls: "bg-gray-100 text-gray-700" };
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
}

