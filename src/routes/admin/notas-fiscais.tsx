import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, ExternalLink, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPriceBRL } from "@/lib/shop";

export const Route = createFileRoute("/admin/notas-fiscais")({
  head: () => ({ meta: [{ title: "Admin — Notas Fiscais" }] }),
  component: () => (
    
      <Page />
    
  ),
});

type StatusFilter = "TODAS" | "AUTORIZADA" | "PROCESSANDO" | "ERRO" | "CANCELADA";

function Page() {
  const [filter, setFilter] = useState<StatusFilter>("TODAS");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["nfe-list", filter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(
          "id, code, customer_name, total_cents, created_at, base_invoice_number, base_invoice_status, base_invoice_danfe_url, base_invoice_xml_url, base_invoice_key, base_invoice_error, base_invoice_emitted_at",
        )
        .not("base_invoice_status", "is", null)
        .order("created_at", { ascending: false });
      if (filter !== "TODAS") query = query.eq("base_invoice_status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-primary" size={24} />
            <h1 className="font-display text-3xl text-primary-dark">Notas Fiscais</h1>
          </div>
          <p className="text-primary-dark/60 mb-6">
            Todas as NFes emitidas automaticamente após pagamento confirmado.
          </p>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(["TODAS", "AUTORIZADA", "PROCESSANDO", "ERRO", "CANCELADA"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-widest transition ${
                  filter === f
                    ? "bg-primary text-cream"
                    : "bg-white border border-border text-primary-dark hover:bg-background/40"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-primary-dark/60">Carregando...</p>}

          <div className="space-y-3">
            {(orders ?? []).map((o: any) => (
              <div key={o.id} className="bg-white rounded-lg p-4 flex items-start gap-4">
                <div className="mt-1">
                  {o.base_invoice_status === "AUTORIZADA" && <CheckCircle className="text-primary" size={20} />}
                  {(o.base_invoice_status === "PROCESSANDO" || o.base_invoice_status === "CRIADA") && (
                    <Clock className="text-amber-600 animate-pulse" size={20} />
                  )}
                  {o.base_invoice_status === "ERRO" && <AlertCircle className="text-red-600" size={20} />}
                  {o.base_invoice_status === "CANCELADA" && <AlertCircle className="text-primary-dark/40" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to="/admin/pedidos" className="font-mono text-sm text-primary-dark hover:text-primary">
                      #{o.code}
                    </Link>
                    <span className="text-xs text-primary-dark/40">·</span>
                    <span className="text-sm text-primary-dark">{o.customer_name}</span>
                    <span className="text-xs text-primary-dark/40">·</span>
                    <span className="text-sm text-primary-dark/70">{formatPriceBRL(o.total_cents)}</span>
                  </div>
                  {o.base_invoice_number && (
                    <p className="text-xs text-primary-dark/60 mt-1">
                      NFe nº {o.base_invoice_number} ·{" "}
                      {new Date(o.base_invoice_emitted_at ?? o.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {o.base_invoice_error && (
                    <p className="text-xs text-red-700 mt-2 font-mono break-all">{o.base_invoice_error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {o.base_invoice_danfe_url && (
                    <a
                      href={o.base_invoice_danfe_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      DANFE <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {o.base_invoice_xml_url && (
                    <a
                      href={o.base_invoice_xml_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      XML <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {(orders ?? []).length === 0 && !isLoading && (
              <div className="text-center py-12 bg-white rounded-xl border border-border">
                <p className="text-primary-dark/60">Nenhuma NFe encontrada.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    
  );
}
