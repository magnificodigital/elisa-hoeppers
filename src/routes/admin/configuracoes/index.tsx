import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Mail, Truck, Users, Stethoscope, CalendarClock, ChevronRight, MailCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/configuracoes/")({
  head: () => ({ meta: [{ title: "Admin — Configurações" }] }),
  component: () => (
    <AdminGuard>
      <ConfigIndex />
    </AdminGuard>
  ),
});

const sections = [
  { to: "/admin/configuracoes/mercadopago", icon: CreditCard, title: "Mercado Pago", desc: "Chaves de produção e teste, toggle de habilitação." },
  { to: "/admin/configuracoes/melhor-envio", icon: Truck, title: "Melhor Envio", desc: "Token, CEP origem, remetente, transportadoras." },
  { to: "/admin/configuracoes/newsletter", icon: Mail, title: "Newsletter", desc: "Audience do Resend e captura de email." },
  { to: "/admin/configuracoes/emails", icon: MailCheck, title: "Emails", desc: "Logotipo, cor, assinatura e rodapé dos emails enviados." },
  { to: "/admin/configuracoes/usuarios", icon: Users, title: "Usuários", desc: "Lista de alunas e admins, convites e troca de role." },
  { to: "/admin/configuracoes/diagnosticos", icon: Stethoscope, title: "Diagnósticos", desc: "Auto-check do MP e do Melhor Envio." },
  { to: "/admin/disponibilidade", icon: CalendarClock, title: "Disponibilidade", desc: "Horários da semana e períodos bloqueados." },
] as const;

function ConfigIndex() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Configurações</h1>
          <p className="text-primary-dark/70 mb-10">Selecione abaixo o que deseja configurar.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="bg-white rounded-xl p-6 shadow-sm flex items-start gap-3 hover:shadow-lg transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
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
    </Layout>
  );
}
