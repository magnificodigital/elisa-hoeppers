import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  LayoutDashboard, User, GraduationCap, Bookmark, ClipboardList,
  ShoppingBag, MessageCircleQuestion, Settings, LogOut,
  BookOpen, Activity, Award,
} from "lucide-react";
import Layout from "@/components/Layout";
import { StarRating } from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { listMyCourseProgress } from "@/lib/enrollments";
import { listLessonsWithProgress } from "@/lib/lessons";
import { getRatingSummariesByIds } from "@/lib/reviews";

export const Route = createFileRoute("/painel/")({
  head: () => ({ meta: [{ title: "Meu Painel — Elisa Hoeppers" }] }),
  component: PainelPage,
});

const navItems = [
  { id: "painel", icon: LayoutDashboard, label: "Painel", active: true, enabled: true },
  { id: "perfil", icon: User, label: "Meu perfil", enabled: false },
  { id: "cursos", icon: GraduationCap, label: "Cursos matriculados", enabled: false },
  { id: "wishlist", icon: Bookmark, label: "Lista de desejos", enabled: true },
  { id: "quizzes", icon: ClipboardList, label: "Tentativas de questionários", enabled: true },
  { id: "certificados", icon: Award, label: "Meus certificados", enabled: true },
  { id: "pedidos", icon: ShoppingBag, label: "Histórico de Pedidos", enabled: true },
  { id: "qa", icon: MessageCircleQuestion, label: "Perguntas & Respostas", enabled: true },
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
  const { data: ratings } = useQuery({
    queryKey: ["ratings-by-ids", courseIds.sort().join(",")],
    queryFn: () => getRatingSummariesByIds(courseIds),
    enabled: courseIds.length > 0,
  });

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

  return (
    <Layout>
      <section className="py-10 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="hidden md:block w-64 shrink-0">
              <div className="bg-white rounded-xl p-4 shadow-sm sticky top-24">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.active;
                    const baseCls = "flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors";
                    const stateCls = isActive
                      ? "bg-primary text-cream font-medium"
                      : item.enabled
                      ? "text-primary-dark hover:bg-cream/60"
                      : "text-primary-dark/40 cursor-not-allowed";
                    return (
                      <div key={item.id} className={`${baseCls} ${stateCls}`}>
                        <Icon size={18} />
                        {item.enabled && !isActive ? (
                          item.id === "quizzes" ? (
                            <Link to="/painel/tentativas" className="flex-1">
                              {item.label}
                            </Link>
                          ) : item.id === "certificados" ? (
                            <Link to="/painel/certificados" className="flex-1">
                              {item.label}
                            </Link>
                          ) : item.id === "pedidos" ? (
                            <Link to="/painel/pedidos" className="flex-1">
                              {item.label}
                            </Link>
                          ) : item.id === "wishlist" ? (
                            <Link to="/painel/wishlist" className="flex-1">
                              {item.label}
                            </Link>
                          ) : item.id === "qa" ? (
                            <Link to="/painel/perguntas" className="flex-1">
                              {item.label}
                            </Link>
                          ) : (
                            <Link to={`/painel/${item.id}`} className="flex-1">
                              {item.label}
                            </Link>
                          )
                        ) : isActive ? (
                          <span className="flex items-center gap-2 flex-1">
                            {item.label}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 flex-1">
                            {item.label}
                            <span className="ml-auto text-[10px] uppercase tracking-wider bg-cream text-primary-dark/50 px-2 py-0.5 rounded-full">
                              Em breve
                            </span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="pt-2 mt-2 border-t border-cream">
                    <button
                      onClick={() => signOut().then(() => navigate({ to: "/" }))}
                      className="flex items-center gap-3 px-4 py-3 rounded-md text-sm w-full text-left text-primary-dark hover:bg-cream/60 transition-colors"
                    >
                      <LogOut size={18} />
                      Sair
                    </button>
                  </div>
                </nav>
              </div>
            </aside>

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <StatCard icon={<BookOpen size={20} className="text-primary" />} value={totalEnrolled} label="Cursos matriculados" />
                <StatCard icon={<Activity size={20} className="text-primary" />} value={totalActive} label="Cursos ativos" />
                <StatCard icon={<Award size={20} className="text-primary" />} value={totalCompleted} label="Cursos completos" />
              </div>

              <h3 className="font-display text-lg text-primary-dark mb-4">Cursos em progresso</h3>

              {isLoading && <p className="text-primary-dark/70">Carregando seus cursos…</p>}

              {!isLoading && enrolled.length === 0 && (
                <div className="bg-white rounded-lg p-8 text-center">
                  <p className="text-primary-dark mb-4">Você ainda não está matriculada em nenhum curso.</p>
                  <Link
                    to="/cursos"
                    className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
                  >
                    Explorar aulas
                  </Link>
                </div>
              )}

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
                          {(() => {
                            const r = ratings?.[c.course_id];
                            const avg = r?.avg_rating ?? 0;
                            const cnt = r?.review_count ?? 0;
                            return (
                              <div className="flex items-center gap-1 mb-2">
                                <StarRating value={avg} size={14} />
                                <span className="text-xs text-primary-dark/50 ml-1">
                                  {avg.toFixed(2)}{cnt > 0 ? ` (${cnt})` : ""}
                                </span>
                              </div>
                            );
                          })()}

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
                    </Link>
                  );
                })}
              </div>
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
