import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  BookOpen, Activity, Award, Package,
} from "lucide-react";
import Layout from "@/components/Layout";
import { PainelSidebar } from "@/components/PainelSidebar";
import { useAuth } from "@/hooks/useAuth";
import { listMyCourseProgress } from "@/lib/enrollments";
import { listLessonsWithProgress } from "@/lib/lessons";
import { listMyOrders, formatPriceBRL, type Order as ShopOrder } from "@/lib/shop";

export const Route = createFileRoute("/painel/")({
  head: () => ({ meta: [{ title: "Meu Painel — Elisa Hoeppers" }] }),
  component: PainelPage,
});

const navItems = [
  { id: "painel", icon: LayoutDashboard, label: "Painel", active: true, enabled: true },
  { id: "perfil", icon: User, label: "Meu perfil", enabled: true },
  { id: "pedidos", icon: ShoppingBag, label: "Histórico de Pedidos", enabled: true },
  { id: "wishlist", icon: Bookmark, label: "Lista de desejos", enabled: true },
  { id: "cursos", icon: GraduationCap, label: "Cursos matriculados", enabled: true, courseOnly: true },
  { id: "quizzes", icon: ClipboardList, label: "Tentativas de questionários", enabled: true, courseOnly: true },
  { id: "certificados", icon: Award, label: "Meus certificados", enabled: true, courseOnly: true },
  { id: "qa", icon: MessageCircleQuestion, label: "Perguntas & Respostas", enabled: true, courseOnly: true },
  { id: "config", icon: Settings, label: "Configurações", enabled: false },
];

function getInitials(name?: string | null, fallbackEmail?: string | null): string {
  const source = name?.trim() || fallbackEmail?.trim() || "";
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PainelPage() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: "/painel" } });
  }, [loading, user, navigate]);

  const { data: progress, isLoading } = useQuery({
    queryKey: ["my-course-progress", user?.id],
    queryFn: listMyCourseProgress,
    enabled: !!user,
  });

  const courseIds = (progress ?? []).map((c) => c.course_id);


  const { data: nextLessonByCourse } = useQuery({
    queryKey: ["next-lesson-by-course", user?.id, courseIds.sort().join(",")],
    queryFn: async () => {
      const map: Record<string, string | null> = {};
      await Promise.all(
        courseIds.map(async (id) => {
          const lessons = await listLessonsWithProgress(id);
          const next = lessons.find((l) => !l.completed) ?? lessons[0];
          map[id] = next?.id ?? null;
        })
      );
      return map;
    },
    enabled: !!user && courseIds.length > 0,
  });

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: listMyOrders,
    enabled: !!user,
  });

  const totalOrders = orders?.length ?? 0;
  const pendingOrders = (orders ?? []).filter((o) => o.status === "pending" || o.status === "confirmed").length;

  if (loading || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark">Carregando…</p>
        </div>
      </Layout>
    );
  }

  const greeting = profile?.full_name ?? user.email ?? "Aluna";
  const initials = getInitials(profile?.full_name, user.email);

  const enrolled = progress ?? [];
  const totalEnrolled = enrolled.length;
  const totalCompleted = enrolled.filter((c) => c.total_lessons > 0 && c.completed_lessons === c.total_lessons).length;
  const totalActive = totalEnrolled - totalCompleted;

  const hasOrders = (orders?.length ?? 0) > 0;
  const hasCourses = enrolled.length > 0;

  return (
    <Layout>
      <section className="py-10 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <PainelSidebar active="painel" />


            {/* Main content */}
            <div className="flex-1 min-w-0">
              {(profile?.role === "admin" || profile?.role === "instructor") && (
                <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-primary-dark">
                    Você tem acesso à área administrativa.
                  </p>
                  <Link
                    to="/admin"
                    className="text-xs uppercase tracking-widest bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition shrink-0"
                  >
                    Abrir admin
                  </Link>
                </div>
              )}

              {/* Header: avatar + saudação + sair */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-primary flex items-center justify-center shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={greeting}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-cream font-display text-lg font-semibold">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-primary-dark/60">Bem-vinda de volta</p>
                    <h1 className="font-display text-2xl md:text-3xl text-primary-dark">
                      Olá, {greeting}
                    </h1>
                  </div>
                </div>
                <button
                  onClick={() => signOut().then(() => navigate({ to: "/" }))}
                  className="text-xs uppercase tracking-widest text-primary-dark hover:opacity-70 self-start mt-2 hidden md:block"
                >
                  Sair
                </button>
              </div>

              <h2 className="font-display text-xl text-primary-dark mb-4">Painel</h2>

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                <StatCard
                  icon={<Package size={20} className="text-primary" />}
                  value={totalOrders}
                  label={pendingOrders > 0 ? `Pedidos · ${pendingOrders} pendente${pendingOrders === 1 ? "" : "s"}` : "Pedidos"}
                />
                {hasCourses && (
                  <>
                    <StatCard icon={<BookOpen size={20} className="text-primary" />} value={totalEnrolled} label="Cursos matriculados" />
                    <StatCard icon={<Activity size={20} className="text-primary" />} value={totalActive} label="Cursos ativos" />
                    <StatCard icon={<Award size={20} className="text-primary" />} value={totalCompleted} label="Cursos completos" />
                  </>
                )}
              </div>


              {/* Empty state geral — sem cursos E sem pedidos */}
              {!isLoading && !hasCourses && !hasOrders && (
                <div className="bg-white rounded-lg p-8 text-center">
                  <h3 className="font-display text-xl text-primary-dark mb-2">Bem-vinda! Por onde quer começar?</h3>
                  <p className="text-primary-dark/70 mb-6">Você ainda não tem pedidos nem cursos.</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Link
                      to="/loja"
                      className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
                    >
                      Ver loja
                    </Link>
                    <Link
                      to="/cursos"
                      className="inline-block border border-primary text-primary px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary hover:text-white transition"
                    >
                      Ver aulas
                    </Link>
                  </div>
                </div>
              )}

              {/* Seção pedidos (destaque principal) */}
              {hasOrders && (
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-primary-dark">Meus pedidos</h3>
                    <Link to="/painel/pedidos" className="text-xs uppercase tracking-widest text-primary hover:text-primary-dark transition">
                      Ver todos →
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {(orders ?? []).slice(0, 5).map((o) => (
                      <CompactOrderRow key={o.id} order={o} />
                    ))}
                  </div>
                </div>
              )}

              {/* CTA loja quando não há pedidos mas há cursos */}
              {!hasOrders && hasCourses && !isLoading && (
                <div className="bg-white rounded-lg p-6 text-center mb-10">
                  <p className="text-primary-dark mb-3">Você ainda não fez nenhum pedido na loja.</p>
                  <Link to="/loja" className="text-xs uppercase tracking-widest text-primary hover:text-primary-dark transition">
                    Explorar a loja →
                  </Link>
                </div>
              )}

              {/* Seção cursos — só aparece se possui algum curso */}
              {hasCourses && (
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-primary-dark">Cursos em progresso</h3>
                    <Link to="/cursos" className="text-xs uppercase tracking-widest text-primary hover:text-primary-dark transition">
                      Ver todos →
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {enrolled.map((c) => {
                      const pct = c.total_lessons > 0 ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0;
                      const nextId = nextLessonByCourse?.[c.course_id];
                      const cardInner = (
                        <>
                          {c.cover_image && (
                            <div className="sm:w-72 shrink-0 relative aspect-video sm:aspect-auto overflow-hidden bg-primary-dark">
                              <img
                                src={c.cover_image}
                                alt={c.course_title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                            <div>


                              <h4 className="font-display text-lg text-primary-dark mb-1">
                                {c.course_title}
                              </h4>

                              <p className="text-sm text-primary-dark/60 mb-4">
                                Aulas completas: {c.completed_lessons} de {c.total_lessons} aulas
                              </p>
                            </div>

                            <div className="mt-auto">
                              <div className="h-2 bg-cream rounded-full overflow-hidden mb-2">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-primary-dark/50">
                                  {pct}% Completo
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                      return nextId ? (
                        <Link
                          key={c.course_id}
                          to="/painel/aula/$lessonId"
                          params={{ lessonId: nextId }}
                          className="flex flex-col sm:flex-row bg-white rounded-lg overflow-hidden hover:shadow-lg transition group"
                        >
                          {cardInner}
                        </Link>
                      ) : (
                        <div
                          key={c.course_id}
                          className="flex flex-col sm:flex-row bg-white rounded-lg overflow-hidden group"
                        >
                          {cardInner}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-display text-2xl text-primary-dark">{value}</div>
        <div className="text-xs text-primary-dark/60">{label}</div>
      </div>
    </div>
  );
}

function CompactOrderRow({ order: o }: { order: ShopOrder }) {
  const totalQty = o.items.reduce((acc, i) => acc + i.qty, 0);
  const statusMap: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendente", cls: "bg-peach/40 text-primary-dark" },
    confirmed: { label: "Confirmado", cls: "bg-primary/10 text-primary" },
    shipped: { label: "Enviado", cls: "bg-accent-teal/15 text-accent-teal" },
    completed: { label: "Concluído", cls: "bg-primary-dark/10 text-primary-dark" },
    cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
  };
  const s = statusMap[o.status] ?? statusMap.pending;

  return (
    <Link
      to="/painel/pedidos"
      className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-display text-primary-dark">#{o.code}</span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
            <span className="text-xs text-primary-dark/50">
              {new Date(o.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
            </span>
          </div>
          <p className="text-sm text-primary-dark/60 truncate">
            {o.items.length === 1
              ? `${o.items[0].qty}× ${o.items[0].name}`
              : `${o.items.length} produtos · ${totalQty} ${totalQty === 1 ? "item" : "itens"}`}
          </p>
        </div>
        <p className="font-display text-primary-dark shrink-0">{formatPriceBRL(o.total_cents)}</p>
      </div>
    </Link>
  );
}
