import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Calendar, Phone, Mail, MessageCircle, Check, X, Clock, Video, MapPin } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import {
  listAppointmentsForAdmin,
  updateAppointmentStatus,
  formatCurrencyBRL,
  formatTime,
  formatDate,
  type AppointmentWithService,
} from "@/lib/appointments";

export const Route = createFileRoute("/admin/agendamentos")({
  head: () => ({ meta: [{ title: "Admin — Agendamentos" }] }),
  component: () => (
    <AdminGuard>
      <AdminAppointments />
    </AdminGuard>
  ),
});

const FILTERS = [
  { id: "pending", label: "Pendentes" },
  { id: "confirmed", label: "Confirmadas" },
  { id: "completed", label: "Concluídas" },
  { id: "cancelled", label: "Canceladas" },
  { id: "all", label: "Todas" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function AdminAppointments() {
  const [filter, setFilter] = useState<FilterId>("pending");

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["admin-appointments", filter],
    queryFn: () =>
      listAppointmentsForAdmin(
        filter === "all" ? {} : { status: filter as AppointmentWithService["status"] },
      ),
  });

  const { data: pendingAll } = useQuery({
    queryKey: ["admin-appointments-pending-count"],
    queryFn: () => listAppointmentsForAdmin({ status: "pending" }),
  });

  return (
    <Layout>
      <section className="py-10 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={22} className="text-primary" />
            <h1 className="font-display text-2xl md:text-3xl text-primary-dark">Agendamentos</h1>
            {(pendingAll?.length ?? 0) > 0 && (
              <span className="ml-2 inline-flex items-center gap-1.5 bg-peach/50 text-primary-dark text-xs px-3 py-1 rounded-full">
                {pendingAll!.length} pendente{pendingAll!.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="text-primary-dark/70 mb-6">Visualize e confirme as reservas das aulas.</p>

          <div className="flex flex-wrap gap-2 mb-8">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                  filter === f.id
                    ? "bg-primary text-white"
                    : "bg-white text-primary-dark border border-border hover:border-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-primary-dark/70">Carregando…</p>}

          {!isLoading && (appointments?.length ?? 0) === 0 && (
            <div className="bg-white rounded-lg p-10 text-center">
              <p className="text-primary-dark/70">Nenhum agendamento neste filtro.</p>
            </div>
          )}

          <div className="space-y-4">
            {(appointments ?? []).map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function AppointmentCard({ appointment: a }: { appointment: AppointmentWithService }) {
  const qc = useQueryClient();
  const startsAt = useMemo(() => new Date(a.starts_at), [a.starts_at]);

  const update = useMutation({
    mutationFn: (status: AppointmentWithService["status"]) => updateAppointmentStatus(a.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-appointments"] });
      qc.invalidateQueries({ queryKey: ["admin-appointments-pending-count"] });
    },
  });

  const cleanPhone = (a.customer_phone ?? "").replace(/\D/g, "");
  const wppNumber =
    cleanPhone.length >= 10 ? (cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`) : null;
  const wppMessage = encodeURIComponent(
    `Oi ${a.customer_name.split(" ")[0]}! Recebi sua reserva #${a.code} pra ${a.service.title} no dia ${formatDate(startsAt)} às ${formatTime(startsAt)}. Vamos confirmar?`,
  );

  return (
    <div className="bg-white rounded-lg p-5 md:p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.3fr_auto] gap-5 md:gap-6">
        {/* Esquerda: aula */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary-dark/50 font-mono">
              #{a.code}
            </span>
            <StatusPill status={a.status} />
            {a.service.is_online ? (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest bg-cream text-primary-dark px-2 py-0.5 rounded-full">
                <Video size={11} /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest bg-cream text-primary-dark px-2 py-0.5 rounded-full">
                <MapPin size={11} /> Presencial
              </span>
            )}
            <span className="text-[10px] uppercase tracking-widest bg-cream text-primary-dark px-2 py-0.5 rounded-full">
              {a.service.is_group ? "Grupo" : "Particular"}
            </span>
          </div>
          <h3 className="font-display text-lg text-primary-dark mb-2">{a.service.title}</h3>
          <div className="text-sm text-primary-dark/70 space-y-1">
            <p className="inline-flex items-center gap-1.5">
              <Calendar size={13} /> {formatDate(startsAt)}
            </p>
            <p className="inline-flex items-center gap-1.5">
              <Clock size={13} /> {formatTime(startsAt)} · {a.service.duration_min} min
            </p>
            <p className="text-primary-dark/60">{formatCurrencyBRL(a.service.price_cents)}</p>
          </div>
        </div>

        {/* Centro: cliente */}
        <div>
          <p className="font-display text-base text-primary-dark mb-2">{a.customer_name}</p>
          <div className="text-sm text-primary-dark/70 space-y-1">
            <p className="inline-flex items-center gap-1.5 break-all">
              <Mail size={13} /> {a.customer_email}
            </p>
            {a.customer_phone && (
              <p className="inline-flex items-center gap-1.5">
                <Phone size={13} /> {a.customer_phone}
              </p>
            )}
          </div>
          {a.notes && (
            <p className="mt-3 text-sm italic text-primary-dark/60 border-l-2 border-cream pl-3">
              “{a.notes}”
            </p>
          )}
        </div>

        {/* Direita: ações */}
        <div className="flex flex-col gap-2 md:w-44">
          {wppNumber && (
            <a
              href={`https://wa.me/${wppNumber}?text=${wppMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-3 py-2 rounded-full text-xs uppercase tracking-widest font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90 transition"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          )}
          {a.status === "pending" && (
            <>
              <button
                onClick={() => update.mutate("confirmed")}
                disabled={update.isPending}
                className="bg-primary text-white px-3 py-2 rounded-full text-xs uppercase tracking-widest font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary-dark transition disabled:opacity-60"
              >
                <Check size={14} /> Confirmar
              </button>
              <button
                onClick={() => {
                  if (confirm("Cancelar reserva?")) update.mutate("cancelled");
                }}
                className="border border-border text-[var(--text-muted)] px-3 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-cream/60 transition inline-flex items-center justify-center gap-1.5"
              >
                <X size={14} /> Cancelar
              </button>
            </>
          )}
          {a.status === "confirmed" && (
            <>
              <button
                onClick={() => update.mutate("completed")}
                className="bg-primary-dark text-white px-3 py-2 rounded-full text-xs uppercase tracking-widest hover:opacity-90 transition inline-flex items-center justify-center gap-1.5"
              >
                <Check size={14} /> Marcar concluída
              </button>
              <button
                onClick={() => {
                  if (confirm("Cancelar reserva?")) update.mutate("cancelled");
                }}
                className="border border-border text-[var(--text-muted)] px-3 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-cream/60 transition"
              >
                Cancelar
              </button>
            </>
          )}
          {a.status === "cancelled" && (
            <button
              onClick={() => update.mutate("pending")}
              className="border border-border text-primary-dark px-3 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-cream/60 transition"
            >
              Reabrir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: AppointmentWithService["status"] }) {
  const map = {
    pending: { label: "Pendente", cls: "bg-peach/40 text-primary-dark" },
    confirmed: { label: "Confirmada", cls: "bg-primary/10 text-primary" },
    completed: { label: "Concluída", cls: "bg-primary-dark/10 text-primary-dark" },
    cancelled: { label: "Cancelada", cls: "bg-red-100 text-red-700" },
  } as const;
  const m = map[status];
  return (
    <span className={`inline-flex items-center text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}
