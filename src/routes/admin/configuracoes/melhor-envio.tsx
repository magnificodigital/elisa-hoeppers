import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Truck } from "lucide-react";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/melhor-envio")({
  head: () => ({ meta: [{ title: "Admin — Melhor Envio" }] }),
  component: () => (
    
      <Page />
    
  ),
});

function Page() {
  return (
    
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
              <Truck size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Melhor Envio</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-2">Cálculo de frete e geração de etiquetas.</p>
          <a href="https://app.melhorenvio.com.br/integracoes/permissoes-de-acesso" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block mb-6">
            Abrir Permissões no Melhor Envio ↗
          </a>

          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20">
            <SettingsCategory category="melhorenvio" />
          </div>

          <Link to="/admin/configuracoes/diagnosticos" className="text-sm text-primary hover:underline inline-block mt-6">
            Rodar diagnóstico do Melhor Envio →
          </Link>
        </div>
      </section>
    
  );
}
