import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatBRLInput } from "@/lib/currency";
import {
  createEntry,
  updateEntry,
  today,
  type FinCategory,
  type FinEntry,
  type FinKind,
} from "@/lib/finance";

export const finInputCls =
  "w-full rounded-lg border border-[#DBCCBF] px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-primary bg-white";

export function FinField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[var(--text-muted)] mt-1">{hint}</p>}
    </div>
  );
}

type Repeat = "nao" | "recorrente" | "parcelado";

export function EntryDialog({
  entry,
  defaultKind = "despesa",
  categories,
  onClose,
}: {
  entry?: FinEntry | null;
  defaultKind?: FinKind;
  categories: FinCategory[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const editing = !!entry;
  const [kind, setKind] = useState<FinKind>(entry?.kind ?? defaultKind);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [amount, setAmount] = useState(entry ? formatBRLInput(String(entry.amount_cents)).display : "");
  const [amountCents, setAmountCents] = useState(entry?.amount_cents ?? 0);
  const [categoryId, setCategoryId] = useState(entry?.category_id ?? "");
  const [due, setDue] = useState(entry?.due_date ?? today());
  const [competence, setCompetence] = useState(entry?.competence_date ?? "");
  const [paid, setPaid] = useState(!!entry?.paid_at);
  const [paidAt, setPaidAt] = useState(entry?.paid_at ?? today());
  const [counterparty, setCounterparty] = useState(entry?.counterparty ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [repeat, setRepeat] = useState<Repeat>("nao");
  const [times, setTimes] = useState("12");

  const cats = categories.filter((c) => c.kind === kind && (c.active || c.id === categoryId));
  const auto = entry && entry.source !== "manual" && entry.source !== "recorrente";

  const save = useMutation({
    mutationFn: async () => {
      if (!description.trim()) throw new Error("Informe a descrição.");
      if (amountCents <= 0) throw new Error("Informe o valor.");
      const base = {
        kind,
        description: description.trim(),
        category_id: categoryId || null,
        amount_cents: amountCents,
        due_date: due,
        competence_date: competence || due,
        paid_at: paid ? paidAt : null,
        counterparty: counterparty.trim() || null,
        notes: notes.trim() || null,
      };
      if (editing) return updateEntry(entry!.id, base);
      const n = repeat === "nao" ? 1 : Math.min(60, Math.max(2, parseInt(times) || 2));
      return createEntry({ ...base, source: "manual" }, n, repeat === "parcelado" ? "parcelado" : "recorrente");
    },
    onSuccess: () => {
      toast.success(editing ? "Lançamento atualizado." : "Lançamento criado.");
      qc.invalidateQueries({ queryKey: ["fin"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-display text-xl text-primary-dark">{editing ? "Editar lançamento" : "Novo lançamento"}</h3>
        {auto && (
          <p className="text-xs bg-sand rounded-lg p-2 text-primary-dark">
            Lançamento automático. Você pode ajustar, mas a conciliação pode atualizar valores e datas.
          </p>
        )}

        {!editing && (
          <div className="grid grid-cols-2 gap-2">
            {(["despesa", "receita"] as FinKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setKind(k); setCategoryId(""); }}
                className={`py-2 rounded-full text-xs uppercase tracking-widest border transition ${
                  kind === k
                    ? k === "despesa" ? "bg-red-700 text-white border-red-700" : "bg-primary text-white border-primary"
                    : "border-border text-primary-dark"
                }`}
              >
                {k === "despesa" ? "Conta a pagar" : "Conta a receber"}
              </button>
            ))}
          </div>
        )}

        <FinField label="Descrição">
          <input autoFocus value={description} onChange={(e) => setDescription(e.target.value)} placeholder={kind === "despesa" ? "ex: Anúncios Instagram" : "ex: Aula particular"} className={finInputCls} />
        </FinField>

        <div className="grid grid-cols-2 gap-3">
          <FinField label={repeat === "parcelado" ? "Valor total" : "Valor"}>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => { const r = formatBRLInput(e.target.value); setAmount(r.display); setAmountCents(r.cents); }}
              placeholder="R$ 0,00"
              className={finInputCls}
            />
          </FinField>
          <FinField label="Categoria">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={finInputCls}>
              <option value="">Sem categoria</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FinField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FinField label="Vencimento">
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={finInputCls} />
          </FinField>
          <FinField label="Mês de referência (DRE)" hint="Vazio = mesmo do vencimento">
            <input type="date" value={competence} onChange={(e) => setCompetence(e.target.value)} className={finInputCls} />
          </FinField>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <label className="flex items-center gap-2 text-sm text-primary-dark cursor-pointer pb-2">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            {kind === "despesa" ? "Já paguei" : "Já recebi"}
          </label>
          {paid && (
            <FinField label={kind === "despesa" ? "Pago em" : "Recebido em"}>
              <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={finInputCls} />
            </FinField>
          )}
        </div>

        <FinField label={kind === "despesa" ? "Fornecedor / quem recebe" : "Cliente / quem paga"}>
          <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} className={finInputCls} />
        </FinField>

        {!editing && (
          <div className="grid grid-cols-[1fr_110px] gap-3 items-end">
            <FinField label="Repetir">
              <select value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)} className={finInputCls}>
                <option value="nao">Não repete</option>
                <option value="recorrente">Todo mês (conta fixa)</option>
                <option value="parcelado">Parcelado (divide o valor)</option>
              </select>
            </FinField>
            {repeat !== "nao" && (
              <FinField label={repeat === "parcelado" ? "Parcelas" : "Meses"}>
                <input type="number" min="2" max="60" value={times} onChange={(e) => setTimes(e.target.value)} className={finInputCls} />
              </FinField>
            )}
          </div>
        )}

        <FinField label="Observação">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={finInputCls} />
        </FinField>

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-full text-xs uppercase tracking-widest text-primary-dark">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark transition disabled:opacity-60"
          >
            {save.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
