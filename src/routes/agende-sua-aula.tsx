import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Video, Users, User as UserIcon, MapPin, ChevronRight, Clock, Check } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import {
  listServices, listTakenSlots, bookAppointment, generateSlotsForDate,
  listAvailabilityRules, listAvailabilityBlocks,
  formatCurrencyBRL, formatTime, formatDate,
  type Service,
} from "@/lib/appointments";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/agende-sua-aula")({
  head: () => ({
    meta: [
      { title: "Agende sua aula — Elisa Hoeppers" },
      { name: "description", content: "Reserve sua aula de yoga particular ou em grupo com Elisa Hoeppers, presencial ou online." },
    ],
  }),
  component: BookingPage,
});

type Step = "service" | "slot" | "form" | "done";

function BookingPage() {
  const { user, profile } = useAuth();

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: listServices,
  });

  const { data: taken } = useQuery({
    queryKey: ["taken-slots"],
    queryFn: listTakenSlots,
  });

  const { data: rules } = useQuery({
    queryKey: ["availability-rules"],
    queryFn: listAvailabilityRules,
  });

  const { data: blocks } = useQuery({
    queryKey: ["availability-blocks"],
    queryFn: listAvailabilityBlocks,
  });

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [step, setStep] = useState<Step>("service");

  const [form, setForm] = useState({
    name: profile?.full_name ?? user?.email?.split("@")[0] ?? "",
    email: user?.email ?? "",
    phone: "",
    notes: "",
  });
  const [confirmCode, setConfirmCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: profile?.full_name ?? f.name,
        email: user.email ?? f.email,
      }));
    }
  }, [user, profile]);

  const slots = useMemo(() => {
    if (!selectedService) return [];
    return generateSlotsForDate(selectedDate, selectedService.duration_min, taken ?? [], rules, blocks);
  }, [selectedService, selectedDate, taken, rules, blocks]);

  const bookMutation = useMutation({
    mutationFn: () =>
      bookAppointment({
        service_id: selectedService!.id,
        starts_at: selectedSlot!.toISOString(),
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: (result) => {
      track("appointment_created", {
        service_id: selectedService!.id,
        is_online: !!selectedService!.is_online,
      });
      setConfirmCode(result.code);
      setStep("done");
    },
  });

  const stepOrder: Step[] = ["service", "slot", "form", "done"];
  const stepIndex = stepOrder.indexOf(step);

  return (
    <Layout>
      <section className="bg-cream py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="font-display text-4xl md:text-5xl text-primary-dark text-center mb-3">Agende sua aula</h1>
          <p className="text-center text-[var(--text-muted)] max-w-2xl mx-auto mb-10">
            Escolha a modalidade que mais combina com você, defina dia e horário e reserve. Confirmação por WhatsApp em até 24h.
          </p>

          {/* Stepper */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs uppercase tracking-widest mb-10">
            {[
              { key: "service", label: "1. Modalidade" },
              { key: "slot", label: "2. Dia & Horário" },
              { key: "form", label: "3. Seus dados" },
              { key: "done", label: "4. Confirmação" },
            ].map((s, i, arr) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className={stepIndex >= i ? "text-primary font-semibold" : "text-[var(--text-muted)]"}>
                  {s.label}
                </span>
                {i < arr.length - 1 && <span className="text-[var(--text-muted)]">·</span>}
              </div>
            ))}
          </div>

          {/* STEP 1: Service */}
          {step === "service" && (
            <div className="grid md:grid-cols-2 gap-4">
              {loadingServices && <p className="text-[var(--text-muted)]">Carregando modalidades…</p>}
              {(services ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep("slot"); }}
                  className="bg-white rounded-xl p-6 text-left border border-border hover:border-primary transition group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
                      {s.is_online ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      <span>
                        {s.is_online ? "Online" : "Presencial"} · {s.is_group ? "Grupo" : "Particular"}
                      </span>
                    </div>
                    {s.is_group ? <Users className="w-5 h-5 text-primary/60" /> : <UserIcon className="w-5 h-5 text-primary/60" />}
                  </div>
                  <h2 className="font-display text-xl text-primary-dark mb-2">{s.title}</h2>
                  {s.description && <p className="text-sm text-[var(--text-muted)] mb-4">{s.description}</p>}
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                      <Clock className="w-4 h-4" /> {s.duration_min} min
                    </span>
                    <span className="font-semibold text-primary-dark">{formatCurrencyBRL(s.price_cents)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: Slot */}
          {step === "slot" && selectedService && (
            <div className="bg-white rounded-xl p-6 md:p-8">
              <button onClick={() => { setStep("service"); setSelectedSlot(null); }} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 mb-4 inline-flex items-center gap-1">
                ← Trocar modalidade
              </button>
              <h2 className="font-display text-2xl text-primary-dark mb-1">{selectedService.title}</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Escolha o dia e o horário.</p>

              <DatePicker selectedDate={selectedDate} onChange={(d) => { setSelectedDate(d); setSelectedSlot(null); }} />

              <div className="mt-8">
                <h3 className="text-xs uppercase tracking-widest text-primary-dark mb-3">
                  Horários para {formatDate(selectedDate)}
                </h3>
                {slots.length === 0 && <p className="text-sm text-[var(--text-muted)]">Sem horários neste dia (domingo fechado).</p>}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {slots.map((slot) => {
                    const isSel = selectedSlot?.getTime() === slot.startsAt.getTime();
                    return (
                      <button
                        key={slot.startsAt.toISOString()}
                        onClick={() => slot.available && setSelectedSlot(slot.startsAt)}
                        disabled={!slot.available}
                        className={`py-2 px-3 rounded-md text-sm transition ${
                          isSel ? "bg-primary text-white border border-primary"
                          : slot.available ? "bg-white border border-border hover:border-primary text-primary-dark"
                          : "bg-sand/40 border border-border text-[var(--text-muted)] line-through cursor-not-allowed"
                        }`}
                      >
                        {formatTime(slot.startsAt)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedSlot && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setStep("form")}
                    className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-semibold hover:bg-primary-dark transition inline-flex items-center gap-2"
                  >
                    Continuar <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Form */}
          {step === "form" && selectedService && selectedSlot && (
            <form
              onSubmit={(e) => { e.preventDefault(); bookMutation.mutate(); }}
              className="bg-white rounded-xl p-6 md:p-8 max-w-xl mx-auto"
            >
              <button type="button" onClick={() => setStep("slot")} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 mb-4 inline-flex items-center gap-1">
                ← Trocar horário
              </button>

              <h2 className="font-display text-2xl text-primary-dark mb-4">Quase lá!</h2>

              <div className="bg-cream/60 rounded-md p-4 mb-6 text-sm text-primary-dark space-y-1">
                <p><strong>Modalidade:</strong> {selectedService.title}</p>
                <p><strong>Dia:</strong> {formatDate(selectedSlot)}</p>
                <p><strong>Horário:</strong> {formatTime(selectedSlot)} · {selectedService.duration_min} min</p>
                <p><strong>Valor:</strong> {formatCurrencyBRL(selectedService.price_cents)}</p>
              </div>

              <div className="space-y-4">
                <Field label="Nome completo">
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                </Field>
                <Field label="E-mail">
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
                </Field>
                <Field label="WhatsApp">
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className={inputCls} />
                </Field>
                <Field label="Observações (opcional)">
                  <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex.: primeira aula, alguma lesão, objetivo..." className={inputCls} />
                </Field>
              </div>

              {bookMutation.error && (
                <p className="text-red-700 text-sm mt-4">
                  {(bookMutation.error as Error).message.includes("slot already taken")
                    ? "Esse horário acabou de ser reservado por outra pessoa. Escolha outro."
                    : (bookMutation.error as Error).message}
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={bookMutation.isPending}
                  className="bg-primary text-white px-10 py-3 rounded-full uppercase tracking-widest text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60"
                >
                  {bookMutation.isPending ? "Reservando…" : "Reservar aula"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Done */}
          {step === "done" && confirmCode && selectedService && selectedSlot && (
            <div className="bg-white rounded-xl p-8 max-w-xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl text-primary-dark mb-2">Reserva recebida!</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Seu código de reserva é <strong className="text-primary-dark font-mono">{confirmCode}</strong>.
                A Elisa vai entrar em contato em até 24h pelo WhatsApp para confirmar e combinar o pagamento.
              </p>

              <div className="bg-cream/60 rounded-md p-4 text-sm text-primary-dark text-left mb-6">
                <p><strong>{selectedService.title}</strong></p>
                <p>{formatDate(selectedSlot)} · {formatTime(selectedSlot)}</p>
                <p>{formatCurrencyBRL(selectedService.price_cents)}</p>
              </div>

              <a
                href={`https://wa.me/5511994061178?text=Oi%20Elisa%2C%20fiz%20uma%20reserva%20%23${confirmCode}%20da%20aula%20${encodeURIComponent(selectedService.title)}%20para%20${encodeURIComponent(formatDate(selectedSlot))}%20%C3%A0s%20${encodeURIComponent(formatTime(selectedSlot))}.`}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-semibold hover:bg-primary-dark transition"
              >
                Falar com a Elisa no WhatsApp
              </a>

              <button
                onClick={() => {
                  setStep("service");
                  setSelectedService(null);
                  setSelectedSlot(null);
                  setConfirmCode(null);
                  setForm({ ...form, notes: "" });
                }}
                className="block mx-auto mt-4 text-xs uppercase tracking-widest text-primary hover:opacity-70"
              >
                Fazer outra reserva
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function DatePicker({ selectedDate, onChange }: { selectedDate: Date; onChange: (d: Date) => void }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });
  const isSame = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="flex gap-2 min-w-max">
        {days.map((d) => {
          const sel = isSame(d, selectedDate);
          const day = d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");
          const num = d.getDate();
          const month = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");
          return (
            <button
              key={d.toISOString()}
              onClick={() => onChange(d)}
              className={`flex flex-col items-center justify-center w-16 py-3 rounded-lg border transition ${
                sel ? "bg-primary text-white border-primary" : "bg-white text-primary-dark border-border hover:border-primary"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-80">{day}</span>
              <span className="text-2xl font-display leading-none">{num}</span>
              <span className="text-[10px] uppercase opacity-80">{month}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const inputCls = "w-full border border-border rounded-md px-3 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">{label}</label>
      {children}
    </div>
  );
}
