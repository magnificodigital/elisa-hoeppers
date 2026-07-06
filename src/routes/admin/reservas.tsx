import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Mail, Phone, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import {
  listReservationsForAdmin,
  updateReservationStatus,
  deleteReservation,
  type ReservationStatus,
} from "@/lib/shop";

export const Route = createFileRoute("/admin/reservas")({
  head: () => ({ meta: [{ title: "Admin — Reservas" }] }),
  component: () => (
    <StaffGuard>
      <ReservationsPage />
    </StaffGuard>
  ),
});

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pendente",
  notified: "Avisado",
  fulfilled: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_ORDER: ReservationStatus[] = ["pending", "notified", "fulfilled", "cancelled"];

function ReservationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: () => listReservationsForAdmin(),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      updateReservationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reservations"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteReservation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reservations"] }),
  });

  const list = (reservations ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl text-primary-dark">Reservas de produtos</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest border transition ${
                filter === s
                  ? "bg-primary text-white border-primary"
                  : "border-border text-[var(--text-muted)] hover:border-primary"
              }`}
            >
              {s === "all" ? "Todas" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-[var(--text-muted)]">Carregando…</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--text-muted)]">Nenhuma reserva encontrada.</p>
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <div key={r.id} className="border border-border rounded-2xl p-4 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-primary-dark">
                      {r.product_name ?? "Produto removido"}
                      <span className="text-[var(--text-muted)] font-normal"> · qtd {r.quantity}</span>
                    </p>
                    <p className="text-sm text-primary-dark mt-1">{r.customer_name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-muted)] mt-1">
                      <a href={`mailto:${r.customer_email}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Mail className="w-3.5 h-3.5" /> {r.customer_email}
                      </a>
                      {r.customer_phone && (
                        <a
                          href={`https://wa.me/${r.customer_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          <Phone className="w-3.5 h-3.5" /> {r.customer_phone}
                        </a>
                      )}
                    </div>
                    {r.notes && <p className="text-sm text-[var(--text-muted)] mt-2 italic">“{r.notes}”</p>}
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        setStatus.mutate({ id: r.id, status: e.target.value as ReservationStatus })
                      }
                      className="border border-border rounded-full px-3 py-1.5 text-xs text-primary-dark focus:outline-none focus:border-primary"
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (confirm("Remover esta reserva?")) remove.mutate(r.id);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
