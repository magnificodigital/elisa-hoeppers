import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronUp, ChevronDown, ShoppingCart, Video, Eye, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { getCourseBySlug } from "@/lib/courses";
import { listLessonsWithProgress, groupLessonsByModule } from "@/lib/lessons";
import { enrollInCourse, getMyEnrollment } from "@/lib/enrollments";

import { WishlistButton } from "@/components/WishlistButton";

export const Route = createFileRoute("/cursos/$slug")({
  loader: async ({ params }) => {
    const course = await getCourseBySlug(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.course.title} — Elisa Hoeppers` },
      {
        name: "description",
        content:
          loaderData?.course.subtitle ??
          loaderData?.course.description?.slice(0, 160) ??
          "",
      },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { course } = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [openModuleIds, setOpenModuleIds] = useState<Set<string>>(new Set());

  function toggleModule(moduleId: string) {
    setOpenModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  const { data: enrollment } = useQuery({
    queryKey: ["my-enrollment", user?.id, course.id],
    queryFn: () => getMyEnrollment(course.id),
    enabled: !!user,
  });

  const { data: lessons } = useQuery({
    queryKey: ["lessons-with-progress", course.id, user?.id],
    queryFn: () => listLessonsWithProgress(course.id),
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollInCourse(course.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-enrollment", user?.id, course.id] });
      qc.invalidateQueries({ queryKey: ["my-course-progress"] });
    },
  });

  const sortedLessons = (lessons ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order);
  const total = sortedLessons.length;
  const completed = sortedLessons.filter((l) => l.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isEnrolled = enrollment?.status === "active";
  const nextLesson = sortedLessons.find((l) => !l.completed) ?? sortedLessons[0];
  const groups = groupLessonsByModule(sortedLessons);

  return (
    <Layout>
      <section className="bg-cream py-10 md:py-14">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6">
          {/* Título + lista de desejos */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">
                {course.title}
              </h1>
              {course.overlay_label && (
                <p className="text-sm text-[var(--text-muted)]">
                  Categorias:{" "}
                  <span className="text-primary-dark font-medium">
                    {course.overlay_label}
                  </span>
                </p>
              )}
            </div>
            <WishlistButton itemType="course" itemId={course.id} />
          </div>

          {/* Grid: cover esquerda + sidebar direita */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* Cover image */}
            <div className="relative rounded-xl overflow-hidden bg-primary-dark aspect-[16/10]">
              {course.cover_image && (
                <img
                  src={course.cover_image}
                  alt={course.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {course.overlay_label && (
                <div className="absolute top-4 left-4">
                  <span className="inline-block bg-white/90 text-primary-dark text-xs uppercase tracking-widest px-3 py-1 rounded">
                    {course.overlay_label}
                  </span>
                </div>
              )}
            </div>

            {/* Sidebar direita */}
            <aside className="space-y-6">
              {/* Card de progresso / matrícula */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
                <h2 className="font-display text-lg text-primary-dark mb-4">
                  {isEnrolled ? "Progresso do Curso" : "Sobre o curso"}
                </h2>

                {isEnrolled ? (
                  <>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-2xl font-semibold text-primary-dark">
                        {completed}/{total}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]">
                        {pct}% Completo
                      </span>
                    </div>
                    <div className="h-2 bg-cream rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {nextLesson && (
                      <Link
                        to="/painel/aula/$lessonId"
                        params={{ lessonId: nextLesson.id }}
                        className="block w-full text-center bg-primary text-white py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-primary-dark transition mb-2"
                      >
                        {completed === 0 ? "Comece a estudar" : "Retomar este curso"}
                      </Link>
                    )}
                    <Link
                      to="/painel"
                      className="block w-full text-center border border-primary text-primary py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-primary hover:text-white transition"
                    >
                      Ver no painel
                    </Link>
                    {enrollment?.enrolled_at && (
                      <div className="mt-4 flex items-start gap-2 text-xs text-[var(--text-muted)]">
                        <ShoppingCart className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>
                          Você se matriculou no curso em{" "}
                          {new Date(enrollment.enrolled_at).toLocaleDateString(
                            "pt-BR",
                            { day: "numeric", month: "long", year: "numeric" },
                          )}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {course.subtitle && (
                      <p className="text-sm text-[var(--text-muted)] mb-4">
                        {course.subtitle}
                      </p>
                    )}
                    <ul className="space-y-2 mb-4 text-sm text-primary-dark">
                      <li className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" />
                        {total} {total === 1 ? "aula" : "aulas"}
                      </li>
                      <li className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        Acesso vitalício após matrícula
                      </li>
                    </ul>
                    <p className="text-2xl font-semibold text-primary-dark mb-4">
                      {course.price_cents == null
                        ? "Grátis"
                        : `R$ ${(course.price_cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </p>
                    {!user ? (
                      <button
                        onClick={() =>
                          navigate({
                            to: "/login",
                            search: { next: `/cursos/${course.slug}` },
                          })
                        }
                        className="block w-full text-center bg-primary text-white py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-primary-dark transition"
                      >
                        Entrar para matricular
                      </button>
                    ) : (
                      <button
                        onClick={() => enrollMutation.mutate()}
                        disabled={enrollMutation.isPending}
                        className="block w-full text-center bg-primary text-white py-3 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-primary-dark transition disabled:opacity-60"
                      >
                        {enrollMutation.isPending
                          ? "Matriculando…"
                          : "Matricular-se gratuitamente"}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Card da instrutora */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">
                  Um curso de
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src="/images/home/bio/elisa-perfil.png"
                    alt="Elisa Hoeppers"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-primary-dark font-medium">Elisa Hoeppers</p>
                    <p className="text-xs text-[var(--text-muted)]">Instrutora</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Descrição */}
          {course.description && (
            <div className="mt-10 max-w-3xl">
              <h2 className="font-display text-2xl text-primary-dark mb-3">
                Sobre este curso
              </h2>
              <p className="text-primary-dark leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>
          )}

          {/* Conteúdo do curso */}
          <div className="mt-12">
            <h2 className="font-display text-2xl text-primary-dark mb-4">
              Conteúdo do curso
            </h2>
            <div className="space-y-3">
              {groups.map((g) => {
                const moduleKey = g.module?.id ?? "__none__";
                const isOpen = openModuleIds.has(moduleKey) || groups.length === 1;
                const groupTotal = g.lessons.length;
                const groupCompleted = g.lessons.filter((l) => l.completed).length;
                return (
                  <div key={moduleKey} className="bg-white rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => toggleModule(moduleKey)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream/40 transition"
                    >
                      <span className="flex items-center gap-3 text-left">
                        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-mono">
                          {g.module ? `M${String(g.module.display_order).padStart(2, "0")}` : "—"}
                        </span>
                        <span className="font-medium text-primary-dark">
                          {g.module?.title ?? "Outras aulas"}
                        </span>
                      </span>
                      <span className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                        <span>
                          {groupCompleted}/{groupTotal}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </button>
                    {isOpen && (
                      <ul className="divide-y divide-border border-t border-border">
                        {g.lessons.map((l) => {
                          const accessible = isEnrolled || l.is_free_preview;
                          const content = (
                            <div className="flex items-center gap-3 px-5 py-3">
                              <Video className="w-4 h-4 text-primary shrink-0" />
                              <span className="flex-1 text-sm text-primary-dark">
                                {l.title}
                              </span>
                              {l.is_free_preview && !isEnrolled && (
                                <span className="text-[10px] uppercase bg-peach text-primary-dark px-2 py-0.5 rounded">
                                  Prévia
                                </span>
                              )}
                              {l.duration_min && (
                                <span className="text-xs text-[var(--text-muted)]">
                                  {l.duration_min} min
                                </span>
                              )}
                              {accessible ? (
                                <Eye className="w-4 h-4 text-primary" />
                              ) : (
                                <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                              )}
                            </div>
                          );
                          return (
                            <li key={l.id}>
                              {accessible ? (
                                <Link
                                  to="/painel/aula/$lessonId"
                                  params={{ lessonId: l.id }}
                                  className="block hover:bg-cream/40 transition"
                                >
                                  {content}
                                </Link>
                              ) : (
                                <div className="opacity-70 cursor-not-allowed">
                                  {content}
                                </div>
                              )}
                            </li>
                          );
                        })}
                        {g.lessons.length === 0 && (
                          <li className="px-5 py-4 text-sm text-[var(--text-muted)] italic">
                            Aulas em breve.
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
              {groups.length === 0 && (
                <div className="bg-white rounded-xl border border-border px-5 py-4 text-sm text-[var(--text-muted)] italic">
                  Aulas em breve.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
