import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Wallet } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/asaas")({
  head: () => ({ meta: [{ title: "Admin — Asaas" }] }),
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
              <Wallet size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Asaas</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-2">
            Gateway com PIX transparente (cliente paga sem sair do site).
          </p>
          <a href="https://www.asaas.com/config/api" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block mb-6">
            Abrir painel Asaas ↗
          </a>

          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Asaas não é mais o gateway ativo
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Todos os pagamentos novos passam pelo <strong>Mercado Pago</strong> (que suporta
                  Apple Pay e Google Pay). As configurações abaixo ficam mantidas pra suportar
                  webhooks atrasados de pedidos antigos.
                </p>
                <p className="text-xs text-amber-800 mt-2">
                  Pra reativar Asaas como gateway principal, ative <code className="bg-amber-100 px-1 rounded">asaas_enabled</code> e desative <code className="bg-amber-100 px-1 rounded">mp_enabled</code> nas configs.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">

            <SettingsCategory category="asaas" />
          </div>

          <div className="mt-6 bg-white rounded-xl p-5 text-sm text-primary-dark/70 space-y-2">
            <p className="font-medium text-primary-dark">Como configurar o webhook</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Gere um token único (ex: <code className="bg-cream px-1 rounded">crypto.randomUUID()</code> no console do navegador).</li>
              <li>Cole o mesmo token no campo <strong>Token do webhook</strong> acima.</li>
              <li>No painel Asaas → Notificações → Webhooks, cadastre a URL:
                <br />
                <code className="bg-cream px-1 py-0.5 rounded text-xs break-all">
                  https://rjksutoohsvwqnqlemjv.functions.supabase.co/asaas-webhook
                </code>
              </li>
              <li>Adicione o header <code className="bg-cream px-1 rounded">asaas-access-token</code> com o mesmo token.</li>
              <li>Ative os eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_DELETED, PAYMENT_REFUNDED.</li>
            </ol>
          </div>
        </div>
      </section>
    </Layout>
  );
}
