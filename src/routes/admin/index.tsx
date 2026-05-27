import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Calendar, ShoppingBag, Package, Settings } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Elisa Hoeppers" }] }),
  component: () => (
    <AdminGuard>
      <AdminHome />
    </AdminGuard>
  ),
});

const sections = [
  { to: "/admin/cursos", icon: GraduationCap, title: "Cursos", desc: "Edite cursos, aulas e quizzes." },
  { to: "/admin/agendamentos", icon: Calendar, title: "Agendamentos", desc: "Confirme reservas de aulas." },
  { to: "/admin/produtos", icon: ShoppingBag, title: "Produtos", desc: "Gerencie o catálogo da loja." },
  { to: "/admin/pedidos", icon: Package, title: "Pedidos", desc: "Acompanhe e atualize pedidos da loja." },
  { to: "/admin/configuracoes", icon: Settings, title: "Configurações", desc: "Chaves de integrações (Mercado Pago, etc)." },
] as const;

function AdminHome() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Admin</h1>
          <p className="text-primary-dark/70 mb-10">Gerencie cursos, aulas, agendamentos, produtos e pedidos.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-primary-dark mb-1 group-hover:text-primary transition">{s.title}</h2>
                    <p className="text-sm text-primary-dark/60">{s.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
