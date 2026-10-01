import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { MODULES, useModules } from "@/lib/system-modules";

export const Route = createFileRoute("/admin/configuracoes/modulos")({
  head: () => ({ meta: [{ title: "Admin — Módulos" }] }),
  component: ModulesPage,
});

function ModulesPage() {
  const qc = useQueryClient();
  const { data: mods, isLoading } = useModules();

  const toggle = async (key: string, on: boolean) => {
    const { error } = await supabase.from("app_settings").update({ value: on ? "true" : "false" }).eq("key", key);
    if (error) return toast.error(error.message);
    toast.success(on ? "Módulo ativado." : "Módulo desativado.");
    qc.invalidateQueries({ queryKey: ["modules"] });
  };

  return (
    <section className="py-12 md:py-16 bg-background min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-4">
        <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
          <ChevronLeft size={16} /> Voltar
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <ToggleRight className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl text-primary-dark">Módulos</h1>
        </div>
        <p className="text-sm text-primary-dark/60 mb-8">
          Liga e desliga partes do sistema que não estão em uso. Desligado, o módulo some do menu e para de funcionar
          (os avisos automáticos dos fornecedores são ignorados). Nada é apagado: é só ligar de novo quando precisar.
        </p>
        <div className="bg-white rounded-xl border border-border/20 divide-y divide-border/40">
          {isLoading && <p className="p-6 text-sm text-[var(--text-muted)]">Carregando…</p>}
          {!isLoading && MODULES.map((m) => {
            const on = mods?.[m.key] === true;
            return (
              <label key={m.key} className="flex items-start gap-4 p-5 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4" checked={on} onChange={(e) => toggle(m.key, e.target.checked)} />
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary-dark">{m.label}</span>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${on ? "bg-primary/10 text-primary" : "bg-cream text-[var(--text-muted)]"}`}>
                      {on ? "Ativo" : "Desativado"}
                    </span>
                  </span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">{m.desc}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
