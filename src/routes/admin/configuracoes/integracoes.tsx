import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plug, Wallet, Truck, Instagram, FileText, Mail, MailCheck, Gift, CreditCard } from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes/integracoes")({
  head: () => ({ meta: [{ title: "Admin — Integrações" }] }),
  component: () => (
    
      <Page />
    
  ),
});

const integrations = [
  { to: "/admin/configuracoes/mercadopago", icon: CreditCard, title: "Mercado Pago", desc: "Gateway padrão — PIX, Cartão, Apple Pay, Google Pay." },
  { to: "/admin/configuracoes/base", icon: FileText, title: "Base ERP (NFe)", desc: "Emissão automática de nota fiscal após pagamento confirmado." },
  { to: "/admin/configuracoes/melhor-envio", icon: Truck, title: "Melhor Envio", desc: "Token, CEP origem, remetente, transportadoras." },
  { to: "/admin/configuracoes/site", icon: Instagram, title: "Feed do Instagram", desc: "Feed automático da home via Behold e handle do perfil." },
  { to: "/admin/configuracoes/emails", icon: MailCheck, title: "Integração Resend", desc: "Status da API key e domínio de envio." },
  { to: "/admin/broadcast", icon: Mail, title: "Emails & Newsletter", desc: "Campanhas, templates, layout, automáticos e inscritos." },
  { to: "/admin/configuracoes/cupom", icon: Gift, title: "Cupom de boas-vindas", desc: "Modal de captura no banner, desconto e email automático." },
  { to: "/admin/configuracoes/asaas", icon: Wallet, title: "Asaas (dormente)", desc: "Não em uso. Pagamentos passam pelo Mercado Pago." },
] as const;


function Page() {
  return (
    
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
              <Plug size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Integrações</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-8">
            Serviços externos conectados ao site: pagamentos, envio e feed social.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {integrations.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="bg-white rounded-xl p-6 shadow-none border border-border/20 flex items-start gap-3 hover:shadow-lg transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-xl text-primary-dark group-hover:text-primary transition">{s.title}</h2>
                    <p className="text-sm text-primary-dark/60 mt-0.5">{s.desc}</p>
                  </div>
                  <ChevronRight size={20} className="text-primary-dark/40 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    
  );
}
