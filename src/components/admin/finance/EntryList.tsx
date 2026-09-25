import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  brl,
  deleteEntry,
  entryStatus,
  fmtDate,
  today,
  updateEntry,
  SOURCE_LABEL,
  type FinCategory,
  type FinEntry,
} from "@/lib/finance";

const STATUS_CLS: Record<string, string> = {
  pago: "bg-primary/10 text-primary",
  vencido: "bg-red-100 text-red-700",
  hoje: "bg-peach/60 text-primary-dark",
  aberto: "bg-cream text-primary-dark",
};

export function EntryList({
  entries,
  categories,
  onEdit,
  empty = "Nenhum lançamento.",
}: {
  entries: FinEntry[];
  categories: FinCategory[];
  onEdit: (e: FinEntry) => void;
  empty?: string;
}) {
  const qc = useQueryClient();
  const cat = new Map(categories.map((c) => [c.id, c.name]));

  const toggle = useMutation({
    mutationFn: (e: FinEntry) => updateEntry(e.id, { paid_at: e.paid_at ? null : today() }),
    onSuccess: (_d, e) => {
      toast.success(e.paid_at ? "Voltou para em aberto." : e.kind === "despesa" ? "Marcado como pago." : "Marcado como recebido.");
      qc.invalidateQueries({ queryKey: ["fin"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: async (e: FinEntry) => {
      if (e.recurrence_group && !e.paid_at) {
        const all = window.confirm(
          "Este lançamento faz parte de uma série.\n\nOK = excluir este e os próximos em aberto\nCancelar = excluir só este",
        );
        return deleteEntry(e.id, all ? { group: e.recurrence_group, due: e.due_date } : undefined);
      }
      if (!window.confirm(`Excluir "${e.description}"?`)) return;
      return deleteEntry(e.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  if (entries.length === 0) return <p className="text-sm text-[var(--text-muted)] py-6 text-center">{empty}</p>;

  return (
    <div className="divide-y divide-border/40">
      {entries.map((e) => {
        const st = entryStatus(e);
        return (
          <div key={e.id} className="py-3 flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-1">
            <div className="w-16 shrink-0 text-xs text-[var(--text-muted)]">{fmtDate(e.due_date)}</div>
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm text-primary-dark break-words">
                {e.description}
                {e.source !== "manual" && (
                  <span className="ml-2 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-sand text-[var(--text-muted)] align-middle">
                    {SOURCE_LABEL[e.source]}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {(e.category_id && cat.get(e.category_id)) || "Sem categoria"}
                {e.counterparty && ` · ${e.counterparty}`}
                {e.paid_at && ` · ${e.kind === "despesa" ? "pago" : "recebido"} em ${fmtDate(e.paid_at)}`}
              </p>
            </div>
            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_CLS[st]}`}>
              {st === "pago" ? (e.kind === "despesa" ? "Pago" : "Recebido") : st === "vencido" ? "Vencido" : st === "hoje" ? "Vence hoje" : "Em aberto"}
            </span>
            <p className={`w-28 text-right text-sm font-medium shrink-0 ${e.kind === "despesa" ? "text-red-700" : "text-primary"}`}>
              {e.kind === "despesa" ? "−" : "+"} {brl(e.amount_cents)}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => toggle.mutate(e)}
                title={e.paid_at ? "Desfazer" : e.kind === "despesa" ? "Marcar como pago hoje" : "Marcar como recebido hoje"}
                className={`p-1.5 rounded-full ${e.paid_at ? "text-[var(--text-muted)] hover:text-primary-dark" : "text-primary hover:bg-primary/10"}`}
              >
                {e.paid_at ? <Undo2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </button>
              <button type="button" onClick={() => onEdit(e)} title="Editar" className="p-1.5 rounded-full text-primary-dark hover:bg-sand">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => remove.mutate(e)} title="Excluir" className="p-1.5 rounded-full text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
