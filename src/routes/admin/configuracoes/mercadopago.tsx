import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, CreditCard } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/mercadopago")({
  head: () => ({ meta: [{ title: "Admin — Mercado Pago" }] }),
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
              <CreditCard size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Mercado Pago</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-2">Configure o checkout online pra aceitar cartão, PIX e boleto.</p>
          <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block mb-6">
            Abrir painel MP ↗
          </a>
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-emerald-900 mb-1">
                  Gateway de pagamento ativo
                </p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  O Mercado Pago é o processador padrão da loja. Aceita <strong>cartão de crédito
                  e débito, PIX, Apple Pay, Google Pay e boleto</strong>. Mantenha o toggle "Ativado"
                  ligado e as chaves preenchidas.
                </p>
              </div>
            </div>
          </div>



          <div className="bg-white rounded-xl p-6 shadow-sm">
            <SettingsCategory category="mercadopago" />
          </div>

          <Link to="/admin/configuracoes/diagnosticos" className="text-sm text-primary hover:underline inline-block mt-6">
            Rodar diagnóstico do Mercado Pago →
          </Link>
        </div>
      </section>
    </Layout>
  );
}
