import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Gift } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/cupom")({
  head: () => ({ meta: [{ title: "Admin — Cupom de boas-vindas" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to="/admin/configuracoes/integracoes"
            className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6"
          >
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
              <Gift size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Cupom de boas-vindas</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-6">
            Configure o modal de captura que aparece ao clicar no botão dos slides marcados como “captura de cupom”.
            O cupom é único por email, enviado automaticamente e válido apenas na primeira compra.
          </p>

          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20">
            <SettingsCategory category="cupom" />
          </div>

          <p className="text-xs text-primary-dark/50 mt-4">
            Para ativar em um slide, edite o slide em <strong>Site → Slider BODYOGA</strong> e marque a opção
            “Botão vira captura de cupom por email”.
          </p>
        </div>
      </section>
    </Layout>
  );
}
