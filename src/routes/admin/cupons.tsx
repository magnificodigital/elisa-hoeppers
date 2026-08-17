import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type AdminCoupon,
} from "@/lib/coupons";

export const Route = createFileRoute("/admin/cupons")({
  head: () => ({ meta: [{ title: "Admin — Cupons" }] }),
  component: CouponsPage,
});

const inputCls =
  "w-full rounded-lg border border-[#DBCCBF] px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-primary";

function slugCode(v: string) {
  return v.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function CouponsPage() {
  const qc = useQueryClient();
  const { data: coupons, isLoading } = useQuery({ queryKey: ["coupons"], queryFn: listCoupons });

  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(10);
  const [days, setDays] = useState<string>("");
  const [multi, setMulti] = useState(false);
  const [limit, setLimit] = useState<string>("");

  const reset = () => {
    setCode("");
    setPercent(10);
    setDays("");
    setMulti(false);
    setLimit("");
  };

  const create = useMutation({
    mutationFn: async () => {
      const c = slugCode(code).trim();
      if (!c) throw new Error("Informe um código.");
      if (percent < 1 || percent > 100) throw new Error("Desconto deve ser entre 1 e 100%.");
      const expires_at =
        days.trim() && Number(days) > 0
          ? new Date(Date.now() + Number(days) * 86400000).toISOString()
          : null;
      const max_uses = multi ? (limit.trim() && Number(limit) > 0 ? Number(limit) : null) : 1;
      await createCoupon({ code: c, discount_percent: percent, max_uses, expires_at, active: true });
    },
    onSuccess: () => {
      toast.success("Cupom criado.");
      reset();
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (e: any) =>
      toast.error(
        /duplicate|unique/i.test(e?.message ?? "") ? "Já existe um cupom com esse código." : e?.message ?? "Erro ao criar cupom.",
      ),
  });

  const toggle = useMutation({
    mutationFn: (c: AdminCoupon) => updateCoupon(c.id, { active: !c.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      toast.success("Cupom removido.");
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  return (
    <section className="py-10 md:py-14 bg-background min-h-[70vh]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-1">
          <Ticket className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl text-primary-dark">Cupons</h1>
        </div>
        <p className="text-sm text-primary-dark/60 mb-8">
          Crie códigos de desconto pra divulgar (inclusive no Instagram). Uso único ou multiuso, com validade e limite.
        </p>

        {/* Criar */}
        <div className="bg-white rounded-xl border border-border/20 p-5 mb-8">
          <h2 className="font-medium text-primary-dark mb-4">Novo cupom</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">Código</label>
              <input
                value={code}
                onChange={(e) => setCode(slugCode(e.target.value))}
                placeholder="BODYOGA10"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">Desconto (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">
                Validade (dias) — opcional
              </label>
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="sem validade"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">Tipo de uso</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMulti(false)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                    !multi ? "bg-primary text-cream border-primary" : "bg-white text-primary-dark border-[#DBCCBF]"
                  }`}
                >
                  Uso único
                </button>
                <button
                  type="button"
                  onClick={() => setMulti(true)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                    multi ? "bg-primary text-cream border-primary" : "bg-white text-primary-dark border-[#DBCCBF]"
                  }`}
                >
                  Multiuso
                </button>
              </div>
            </div>
            {multi && (
              <div>
                <label className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">
                  Limite de usos — opcional
                </label>
                <input
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="ilimitado"
                  className={inputCls}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-cream px-6 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <Plus size={16} /> {create.isPending ? "Criando…" : "Criar cupom"}
          </button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <p className="text-sm text-primary-dark/60">Carregando…</p>
        ) : !coupons || coupons.length === 0 ? (
          <p className="text-sm text-primary-dark/60">Nenhum cupom criado ainda.</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((c) => {
              const expired = c.expires_at != null && new Date(c.expires_at) < new Date();
              const usedUp = c.max_uses != null && c.uses_count >= c.max_uses;
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-border/20 p-4 flex flex-wrap items-center gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-primary-dark">{c.code}</span>
                      <span className="text-sm text-primary-dark/70">· {c.discount_percent}%</span>
                      {c.email && (
                        <span className="text-[10px] uppercase tracking-wide bg-[#F0E9DD] text-primary-dark/60 px-2 py-0.5 rounded">
                          boas-vindas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-primary-dark/60 mt-1">
                      {c.max_uses == null ? "Multiuso ilimitado" : c.max_uses === 1 ? "Uso único" : `Multiuso · ${c.uses_count}/${c.max_uses} usados`}
                      {c.max_uses != null && c.max_uses > 1 ? "" : c.max_uses === 1 ? ` · ${c.uses_count > 0 ? "usado" : "não usado"}` : ""}
                      {c.expires_at ? ` · vence ${new Date(c.expires_at).toLocaleDateString("pt-BR")}` : " · sem validade"}
                      {expired ? " · EXPIRADO" : usedUp ? " · ESGOTADO" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle.mutate(c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      c.active
                        ? "border-green-600 text-green-700 hover:bg-green-50"
                        : "border-[#DBCCBF] text-primary-dark/60 hover:bg-primary/5"
                    }`}
                  >
                    {c.active ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remover o cupom ${c.code}?`)) remove.mutate(c.id);
                    }}
                    className="text-red-600/80 hover:text-red-600 transition"
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
