import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Stethoscope, CreditCard, Truck, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/configuracoes/diagnosticos")({
  head: () => ({ meta: [{ title: "Admin — Diagnósticos" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

const diags = [
  { to: "/admin/diagnostico-pagamentos", icon: CreditCard, title: "Mercado Pago", desc: "Token, modo, criação de preference de teste." },
  { to: "/admin/diagnostico-envio", icon: Truck, title: "Melhor Envio", desc: "Token, ambiente, CEP, remetente, teste de cálculo." },
] as const;

function Page() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
              <Stethoscope size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Diagnósticos</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-8">Verifique se as integrações estão funcionando corretamente.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {diags.map((d) => {
              const Icon = d.icon;
              return (
                <Link
                  key={d.to}
                  to={d.to}
                  className="bg-white rounded-xl p-6 shadow-none border border-border/20 flex items-start gap-3 hover:shadow-lg transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-xl text-primary-dark group-hover:text-primary transition">{d.title}</h2>
                    <p className="text-sm text-primary-dark/60 mt-0.5">{d.desc}</p>
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
