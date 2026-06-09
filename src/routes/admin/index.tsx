import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Calendar,
  ShoppingBag,
  Package,
  Settings,
  Mail,
  FileText,
  Share2,
  TrendingUp,
  DollarSign,
  Users,
  Bell,
  AlertCircle,
  
  
  Stethoscope,
  Truck,
} from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminSearchBar } from "@/components/AdminSearchBar";
import { getDashboardStats } from "@/lib/analytics";

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
  { to: "/admin/disponibilidade", icon: Calendar, title: "Disponibilidade", desc: "Horários da semana e bloqueios." },
  { to: "/admin/produtos", icon: ShoppingBag, title: "Produtos", desc: "Gerencie o catálogo da loja." },
  { to: "/admin/pedidos", icon: Package, title: "Pedidos", desc: "Acompanhe e atualize pedidos da loja." },
  { to: "/admin/clientes", icon: Users, title: "Clientes", desc: "Veja seus clientes e quem está inscrito." },
  { to: "/admin/blog", icon: FileText, title: "Blog Posts", desc: "Crie e edite posts de Dicas." },
  { to: "/admin/social", icon: Share2, title: "Social Posts", desc: "Posts para as redes sociais." },
  { to: "/admin/broadcast", icon: Mail, title: "Emails", desc: "Envie email pra newsletter ou alunas." },
  { to: "/admin/configuracoes", icon: Settings, title: "Configurações", desc: "Integrações (Mercado Pago, Newsletter)." },
  { to: "/admin/diagnostico-pagamentos", icon: Stethoscope, title: "Diagnóstico Pagamentos", desc: "Auto-check da integração Mercado Pago." },
  { to: "/admin/diagnostico-envio", icon: Truck, title: "Diagnóstico Envio", desc: "Auto-check do Melhor Envio." },
] as const;

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AdminHome() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const pendingCount = (stats?.orders_pending ?? 0) + (stats?.appointments_pending ?? 0);

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Admin</h1>
          <p className="text-primary-dark/70 mb-6">Visão geral do site nos últimos 30 dias.</p>

          <div className="mb-8">
            <AdminSearchBar />
          </div>

          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
              <div className="flex items-start gap-3">
                <Bell className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="font-medium text-primary-dark mb-2">
                    {pendingCount === 1
                      ? "Você tem 1 item esperando ação"
                      : `Você tem ${pendingCount} itens esperando ação`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(stats?.appointments_pending ?? 0) > 0 && (
                      <Link
                        to="/admin/agendamentos"
                        className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full text-primary-dark hover:bg-amber-100 transition"
                      >
                        {stats!.appointments_pending} reserva
                        {stats!.appointments_pending === 1 ? "" : "s"} pendente
                        {stats!.appointments_pending === 1 ? "" : "s"}
                      </Link>
                    )}
                    {(stats?.orders_pending ?? 0) > 0 && (
                      <Link
                        to="/admin/pedidos"
                        className="inline-flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full text-primary-dark hover:bg-amber-100 transition"
                      >
                        {stats!.orders_pending} pedido
                        {stats!.orders_pending === 1 ? "" : "s"} pendente
                        {stats!.orders_pending === 1 ? "" : "s"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <KpiCard
              icon={<DollarSign size={16} />}
              label="Receita (30d)"
              value={isLoading ? "…" : formatBRL(stats?.revenue_month_cents ?? 0)}
              sub={isLoading ? "" : `${stats?.orders_month ?? 0} pedido${(stats?.orders_month ?? 0) === 1 ? "" : "s"}`}
            />
            <KpiCard
              icon={<GraduationCap size={16} />}
              label="Matrículas (30d)"
              value={isLoading ? "…" : String(stats?.enrollments_month ?? 0)}
              sub={isLoading ? "" : `${stats?.enrollments_total ?? 0} ativ${(stats?.enrollments_total ?? 0) === 1 ? "a" : "as"} total`}
            />
            <KpiCard
              icon={<Calendar size={16} />}
              label="Reservas (30d)"
              value={isLoading ? "…" : String(stats?.appointments_month ?? 0)}
              sub={
                isLoading
                  ? ""
                  : (stats?.appointments_pending ?? 0) > 0
                    ? `${stats!.appointments_pending} pendente${stats!.appointments_pending === 1 ? "" : "s"}`
                    : "0 pendentes"
              }
            />
            <KpiCard
              icon={<Users size={16} />}
              label="Novos cadastros (30d)"
              value={isLoading ? "…" : String(stats?.students_month ?? 0)}
              sub={isLoading ? "" : `${stats?.students_total ?? 0} aluna${(stats?.students_total ?? 0) === 1 ? "" : "s"} total`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <TopList
              icon={<TrendingUp size={18} className="text-primary" />}
              title="Cursos mais matriculados (ano)"
              items={(stats?.top_courses ?? []).map((c) => ({ label: c.title, count: c.cnt, href: `/cursos/${c.slug}` }))}
            />
            <TopList
              icon={<TrendingUp size={18} className="text-primary" />}
              title="Produtos mais vendidos (ano)"
              items={(stats?.top_products ?? []).map((p) => ({ label: p.name, count: p.cnt, href: `/loja/${p.slug}` }))}
            />
          </div>

          <h2 className="font-display text-xl text-primary-dark mb-4">Atalhos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition flex items-start gap-4 group"
                >
                  <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-primary-dark mb-1 group-hover:text-primary transition">
                      {s.title}
                    </h3>
                    <p className="text-sm text-primary-dark/60">{s.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {stats == null && !isLoading && (
            <div className="mt-10 bg-white rounded-xl p-6 border border-red-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-primary-dark">Estatísticas indisponíveis</p>
                  <p className="text-sm text-primary-dark/60">Confira sua permissão de admin no Supabase.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary-dark/60 mb-2">
        {icon}
        {label}
      </div>
      <p className="font-display text-2xl md:text-3xl text-primary-dark leading-tight">{value}</p>
      <p className="text-xs text-primary-dark/60 mt-1">{sub}</p>
    </div>
  );
}

function TopList({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: Array<{ label: string; count: number; href?: string }>;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-display text-lg text-primary-dark">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-primary-dark/60">Sem dados ainda.</p>
      ) : (
        <ol className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-cream flex items-center justify-center text-xs font-medium text-primary shrink-0">
                {i + 1}
              </span>
              {it.href ? (
                <a href={it.href} className="flex-1 text-primary-dark hover:text-primary transition truncate">
                  {it.label}
                </a>
              ) : (
                <span className="flex-1 text-primary-dark truncate">{it.label}</span>
              )}
              <span className="text-primary-dark/60 tabular-nums">{it.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
