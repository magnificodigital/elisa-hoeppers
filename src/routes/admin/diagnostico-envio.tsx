import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Check = {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  detail: string;
};

type DiagResult = { checks: Check[] };

async function fetchDiag(): Promise<DiagResult> {
  const { data, error } = await supabase.functions.invoke("diag-me", { body: {} });
  if (error) throw error;
  return data as DiagResult;
}

export const Route = createFileRoute("/admin/diagnostico-envio")({
  head: () => ({ meta: [{ title: "Admin — Diagnóstico Envio" }] }),
  component: () => (
    
      <DiagPage />
    
  ),
});

function DiagPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["diag-me"],
    queryFn: fetchDiag,
    refetchOnWindowFocus: false,
  });

  const allOk = data?.checks.every((c) => c.status === "ok") ?? false;
  const hasError = data?.checks.some((c) => c.status === "error") ?? false;

  return (
    
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Diagnóstico — Melhor Envio</h1>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition disabled:opacity-60"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              {isFetching ? "Verificando..." : "Re-verificar"}
            </button>
          </div>

          <p className="text-primary-dark/70 mb-8">
            Auto-check em 6 etapas. Re-verifique após qualquer mudança em /admin/configuracoes.
          </p>

          {isLoading && <p className="text-primary-dark/60">Rodando checks…</p>}

          {data && (
            <>
              <div
                className={`rounded-xl p-5 mb-6 font-medium ${
                  allOk
                    ? "bg-primary/5 border border-primary/20 text-primary-dark"
                    : hasError
                      ? "bg-red-50 border border-red-200 text-red-900"
                      : "bg-amber-50 border border-amber-200 text-amber-900"
                }`}
              >
                {allOk
                  ? "✅ Tudo certo — ME pronto pra calcular frete e gerar etiquetas"
                  : hasError
                    ? "❌ Tem problema bloqueando o ME"
                    : "⚠️ Configuração parcial — confira os avisos"}
              </div>

              <div className="space-y-3">
                {data.checks.map((c) => (
                  <CheckRow key={c.id} check={c} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    
  );
}

function CheckRow({ check }: { check: Check }) {
  const cfg = {
    ok: { Icon: CheckCircle, cls: "bg-primary/5 border-primary/20", iconCls: "text-primary" },
    warn: { Icon: AlertCircle, cls: "bg-amber-50 border-amber-200", iconCls: "text-amber-600" },
    error: { Icon: XCircle, cls: "bg-red-50 border-red-200", iconCls: "text-red-600" },
  }[check.status];
  const { Icon } = cfg;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${cfg.cls}`}>
      <Icon size={20} className={`shrink-0 mt-0.5 ${cfg.iconCls}`} />
      <div className="min-w-0">
        <p className="font-medium text-primary-dark">{check.label}</p>
        <p className="text-sm text-primary-dark/70 break-words">{check.detail}</p>
      </div>
    </div>
  );
}
