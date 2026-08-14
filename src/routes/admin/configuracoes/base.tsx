import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/base")({
  head: () => ({ meta: [{ title: "Admin — Base ERP (NFe)" }] }),
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
          <Link
            to="/admin/configuracoes"
            className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6"
          >
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
              <FileText size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Base ERP (NFe)</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-6">
            Emissão automática de nota fiscal de produto (NFe) após pagamento confirmado.
            Precisa CNAE, regime fiscal e certificado A1 cadastrados no Base ERP.
          </p>

          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20">
            <SettingsCategory category="base" />
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900 mb-2 font-medium">📌 Checklist pré-emissão</p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Cada produto precisa ter NCM cadastrado (em /admin/produtos)</li>
              <li>Regime tributário definido no Base ERP</li>
              <li>Certificado digital A1 uploaded no Base ERP</li>
              <li>CNAE fiscal correto no Base ERP</li>
              <li>Alíquotas de imposto configuradas com contadora</li>
            </ul>
          </div>

          <div className="mt-6 bg-white rounded-xl p-4 border border-border">
            <p className="text-xs uppercase tracking-widest text-primary-dark/60 mb-2">URL do webhook Base ERP</p>
            <code className="text-xs text-primary-dark break-all font-mono">
              https://rjksutoohsvwqnqlemjv.functions.supabase.co/base-webhook
            </code>
            <p className="text-xs text-primary-dark/60 mt-2">
              No Base ERP → Configurações → Webhooks, cadastre a URL acima, envie o token
              no header <code className="font-mono">access_token</code> e marque os eventos
              <em> INVOICE_NFE_AUTHORIZED</em>, <em>INVOICE_NFE_ERROR</em>, <em>INVOICE_NFE_CANCELED</em>
              {" "}e <em>INVOICE_NFE_CREATED</em>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
