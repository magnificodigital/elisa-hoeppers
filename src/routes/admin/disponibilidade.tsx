import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Calendar, Plus, Trash2, Clock, Save } from "lucide-react";
import {
  listAvailabilityRules, updateAvailabilityRule,
  listAvailabilityBlocks, createAvailabilityBlock, deleteAvailabilityBlock,
  type AvailabilityRule, type AvailabilityBlock,
} from "@/lib/appointments";

export const Route = createFileRoute("/admin/disponibilidade")({
  head: () => ({ meta: [{ title: "Admin — Disponibilidade" }] }),
  component: () => (
    
      <AvailabilityPage />
    
  ),
});

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function AvailabilityPage() {
  const { data: rules } = useQuery({ queryKey: ["availability-rules"], queryFn: listAvailabilityRules });
  const { data: blocks } = useQuery({ queryKey: ["availability-blocks"], queryFn: listAvailabilityBlocks });

  return (
    
      <div className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-primary" size={28} />
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Disponibilidade</h1>
          </div>
          <p className="text-primary-dark/70 mb-8">
            Defina seus horários semanais e bloqueie períodos específicos (feriados, férias, etc).
          </p>

          {/* Semanal */}
          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20 mb-8">
            <h2 className="font-display text-xl text-primary-dark mb-1">Horários da semana</h2>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              Defina os horários em que você atende cada dia.
            </p>
            <div className="space-y-2">
              {(rules ?? []).map((r) => (
                <RuleRow key={r.day_of_week} rule={r} />
              ))}
            </div>
          </div>

          {/* Bloqueios */}
          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20">
            <h2 className="font-display text-xl text-primary-dark mb-1">Períodos bloqueados</h2>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              Adicione períodos em que você não atende (mesmo nos dias da semana liberados).
            </p>

            <NewBlockForm />

            <div className="mt-6 space-y-2">
              {(blocks ?? []).map((b) => (
                <BlockRow key={b.id} block={b} />
              ))}
              {(blocks?.length ?? 0) === 0 && (
                <p className="text-sm text-[var(--text-muted)] italic">Nenhum bloqueio futuro.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    
  );
}

function RuleRow({ rule }: { rule: AvailabilityRule }) {
  const qc = useQueryClient();
  const [active, setActive] = useState(rule.is_active);
  const [start, setStart] = useState(rule.start_time?.slice(0, 5) ?? "08:00");
  const [end, setEnd] = useState(rule.end_time?.slice(0, 5) ?? "18:00");

  useEffect(() => {
    setActive(rule.is_active);
    setStart(rule.start_time?.slice(0, 5) ?? "08:00");
    setEnd(rule.end_time?.slice(0, 5) ?? "18:00");
  }, [rule]);

  const save = useMutation({
    mutationFn: () => updateAvailabilityRule(rule.day_of_week, {
      is_active: active,
      start_time: active ? `${start}:00` : null,
      end_time: active ? `${end}:00` : null,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability-rules"] }),
  });

  const dirty = active !== rule.is_active ||
    (active && (`${start}:00` !== rule.start_time || `${end}:00` !== rule.end_time));

  return (
    <div className="flex flex-wrap items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="font-medium text-primary-dark w-24 flex-shrink-0">{WEEKDAYS[rule.day_of_week]}</span>
      <button
        type="button"
        onClick={() => setActive(!active)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition flex-shrink-0 ${active ? "bg-primary" : "bg-sand"}`}
        aria-label="Toggle dia"
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${active ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      {active ? (
        <div className="flex items-center gap-2 text-sm text-primary-dark flex-1 min-w-0 basis-full sm:basis-auto">
          <Clock size={14} className="text-[var(--text-muted)] flex-shrink-0" />
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="border border-border rounded-md px-2 py-1 text-sm bg-white text-primary-dark min-w-0 flex-1" />
          <span className="text-[var(--text-muted)] flex-shrink-0">até</span>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="border border-border rounded-md px-2 py-1 text-sm bg-white text-primary-dark min-w-0 flex-1" />
        </div>
      ) : (
        <span className="text-sm text-[var(--text-muted)] italic flex-1">Fechado</span>
      )}
      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={!dirty || save.isPending}
        className="bg-primary text-white px-3 py-1.5 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-40 inline-flex items-center gap-1 flex-shrink-0"
      >
        <Save size={12} /> Salvar
      </button>
    </div>
  );
}

function NewBlockForm() {
  const qc = useQueryClient();
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");

  const create = useMutation({
    mutationFn: () => createAvailabilityBlock({
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      reason: reason || undefined,
    }),
    onSuccess: () => {
      setStartsAt(""); setEndsAt(""); setReason("");
      qc.invalidateQueries({ queryKey: ["availability-blocks"] });
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
      className="bg-background/40 rounded-lg p-4 space-y-3"
    >
      <p className="text-xs uppercase tracking-widest text-primary-dark font-semibold">Novo bloqueio</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Início</label>
          <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 bg-white text-sm" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Fim</label>
          <input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 bg-white text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Motivo (opcional)</label>
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: férias, feriado, viagem" className="w-full border border-border rounded-md px-3 py-2 bg-white text-sm" />
      </div>
      {create.error && <p className="text-red-700 text-sm">{(create.error as Error).message}</p>}
      <button type="submit" disabled={create.isPending || !startsAt || !endsAt} className="bg-primary text-white px-4 py-2 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-40 inline-flex items-center gap-2">
        <Plus size={14} /> {create.isPending ? "Adicionando..." : "Adicionar bloqueio"}
      </button>
    </form>
  );
}

function BlockRow({ block }: { block: AvailabilityBlock }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => deleteAvailabilityBlock(block.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability-blocks"] }),
  });

  const fmt = (s: string) => new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm text-primary-dark font-medium">
          {fmt(block.starts_at)} até {fmt(block.ends_at)}
        </p>
        {block.reason && <p className="text-xs text-[var(--text-muted)] mt-0.5">{block.reason}</p>}
      </div>
      <button
        type="button"
        onClick={() => { if (confirm("Remover bloqueio?")) del.mutate(); }}
        className="text-[var(--text-muted)] hover:text-red-700 transition flex-shrink-0"
        aria-label="Remover"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
