import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";

type Check = {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  detail: string;
};

type DiagResult = {
  checks: Check[];
  test_preference: { ok: boolean; init_point?: string; error?: string };
};

async function fetchDiag(): Promise<DiagResult> {
  const { data, error } = await supabase.functions.invoke("diag-mp", { body: {} });
  if (error) throw error;
  return data as DiagResult;
}

export const Route = createFileRoute("/admin/diagnostico-pagamentos")({
  head: () => ({ meta: [{ title: "Admin — Diagnóstico MP" }] }),
  component: () => (
    <AdminGuard>
      <DiagPage />
    </AdminGuard>
  ),
});

function DiagPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["diag-mp"],
    queryFn: fetchDiag,
    refetchOnWindowFocus: false,
  });

  const allOk = data?.checks.every((c) => c.status === "ok") ?? false;
  const hasError = data?.checks.some((c) => c.status === "error") ?? false;

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Diagnóstico — Mercado Pago</h1>
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
            Auto-check de 6 etapas. Re-verifique após qualquer mudança em /admin/configuracoes.
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
                  ? "✅ Tudo certo — MP está pronto pra receber pagamentos"
                  : hasError
                    ? "❌ Tem problema bloqueando o MP"
                    : "⚠️ Configuração parcial — confira os avisos"}
              </div>

              <div className="space-y-3">
                {data.checks.map((c) => (
                  <CheckRow key={c.id} check={c} />
                ))}
              </div>

              {data.test_preference.ok && data.test_preference.init_point && (
                <div className="mt-6 bg-white rounded-xl p-5 shadow-none border border-border/20">
                  <p className="text-sm text-primary-dark/70 mb-3">
                    🎉 Teste passou. Abra o link abaixo numa janela anônima pra ver a tela de pagamento do MP de
                    verdade (R$ 1,00 — não pague, é só pra visualizar):
                  </p>
                  <a
                    href={data.test_preference.init_point}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm hover:bg-primary-dark transition"
                  >
                    Abrir checkout MP de teste <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
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
