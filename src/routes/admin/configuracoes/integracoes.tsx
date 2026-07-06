import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Plug, Instagram } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/integracoes")({
  head: () => ({ meta: [{ title: "Admin — Integrações" }] }),
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
              <Plug size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Integrações</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-8">
            Guarde aqui as chaves e tokens de serviços externos. Os campos marcados como secretos ficam
            mascarados e só são usados pelo servidor — nunca aparecem no site público.
          </p>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <Instagram size={20} className="text-primary" />
              <h2 className="font-display text-xl text-primary-dark">Instagram</h2>
            </div>
            <SettingsCategory category="integracoes" />

            <div className="mt-6 border-t border-border pt-4 text-xs text-primary-dark/60 space-y-1.5">
              <p className="font-medium text-primary-dark/80">Como obter o token:</p>
              <p>1. Acesse developers.facebook.com → crie/abra um app do tipo Business.</p>
              <p>2. Adicione o produto Instagram Graph API e vincule a Página do Facebook + a conta.</p>
              <p>3. Gere um token com as permissões instagram_basic e pages_show_list.</p>
              <p>4. Converta para um token de longa duração (~60 dias) e cole acima.</p>
            </div>
          </div>

          <p className="text-xs text-primary-dark/50 mt-4">
            Dica: com o Instagram ligado e o token válido, a seção da home passa a mostrar os posts reais
            mais recentes automaticamente. Sem token válido, ela mantém as imagens padrão.
          </p>
        </div>
      </section>
    </Layout>
  );
}
