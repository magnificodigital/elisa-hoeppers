import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/newsletter")({
  head: () => ({ meta: [{ title: "Admin — Newsletter" }] }),
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
              <Mail size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Newsletter</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-2">Audience do Resend e captura de email da home/footer.</p>
          <a href="https://resend.com/audiences" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block mb-6">
            Abrir Audiences no Resend ↗
          </a>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <SettingsCategory category="newsletter" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
