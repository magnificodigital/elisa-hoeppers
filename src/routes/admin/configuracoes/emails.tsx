import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, MailCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/emails")({
  head: () => ({ meta: [{ title: "Admin — Emails" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
              <MailCheck size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Emails</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-6">
            Personalize a aparência dos emails transacionais (confirmações, envios, agendamentos) e das campanhas.
            O logotipo aparece no topo e a assinatura/rodapé no final de todos os emails.
          </p>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <SettingsCategory category="emails" />
          </div>

          <p className="text-xs text-primary-dark/50 mt-4">
            Dica: o logotipo precisa estar em um endereço público (URL que abre no navegador). O padrão usa o logo do
            site publicado. Alterações passam a valer nos próximos emails enviados.
          </p>
        </div>
      </section>
    </Layout>
  );
}
