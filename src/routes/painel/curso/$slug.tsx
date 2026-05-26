import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { getCourseBySlug } from "@/lib/courses";
import { listLessonsWithProgress } from "@/lib/lessons";
import { isEnrolledInCourse } from "@/lib/enrollments";

export const Route = createFileRoute("/painel/curso/$slug")({
  loader: async ({ params }) => {
    const course = await getCourseBySlug(params.slug);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.course.title} — Painel — Elisa Hoeppers` }],
  }),
  component: PainelCourseArea,
});

function PainelCourseArea() {
  const { course } = Route.useLoaderData();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: `/painel/curso/${course.slug}` } });
  }, [loading, user, course.slug, navigate]);

  const { data: enrolled, isLoading: checkingEnrollment } = useQuery({
    queryKey: ["is-enrolled", user?.id, course.id],
    queryFn: () => isEnrolledInCourse(course.id),
    enabled: !!user,
  });

  const { data: lessons, isLoading: loadingLessons } = useQuery({
    queryKey: ["lessons-with-progress", course.id, user?.id],
    queryFn: () => listLessonsWithProgress(course.id),
    enabled: !!user,
  });

  if (loading || !user || checkingEnrollment) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark">Carregando…</p>
        </div>
      </Layout>
    );
  }

  if (!enrolled) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark mb-4">Você não está matriculada neste curso.</p>
          <Link
            to="/cursos/$slug"
            params={{ slug: course.slug }}
            className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
          >
            Ver curso
          </Link>
        </div>
      </Layout>
    );
  }

  const completedCount = lessons?.filter((l) => l.completed).length ?? 0;
  const totalCount = lessons?.length ?? 0;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextLesson = lessons?.find((l) => !l.completed);

  return (
    <Layout>
      <section className="py-12 bg-cream min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/painel" className="text-xs uppercase tracking-widest text-primary-dark/70 hover:opacity-70">
            ← Voltar ao painel
          </Link>

          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mt-4">{course.title}</h1>
          {course.subtitle && <p className="text-primary-dark/70 mt-2">{course.subtitle}</p>}

          <div className="bg-white rounded-lg p-6 my-8">
            <div className="flex justify-between items-baseline mb-3">
              <p className="text-sm text-primary-dark">
                {completedCount} de {totalCount} aulas concluídas
              </p>
              <p className="text-lg font-display text-primary-dark">{pct}%</p>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            {nextLesson && (
              <Link
                to="/painel/aula/$lessonId"
                params={{ lessonId: nextLesson.id }}
                className="inline-block bg-primary text-white px-6 py-2.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
              >
                {completedCount === 0 ? "Começar agora" : "Continuar de onde parou"}
              </Link>
            )}
          </div>

          <h2 className="font-display text-2xl text-primary-dark mb-4">Conteúdo do curso</h2>
          {loadingLessons && <p className="text-primary-dark/70">Carregando aulas…</p>}

          <div className="space-y-2">
            {(lessons ?? []).map((l, i) => (
              <Link
                key={l.id}
                to="/painel/aula/$lessonId"
                params={{ lessonId: l.id }}
                className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow transition"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                    l.completed ? "bg-primary text-white" : "bg-cream text-primary-dark"
                  }`}
                >
                  {l.completed ? "✓" : String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex-1">
                  <p className="text-primary-dark">{l.title}</p>
                  {l.duration_min && (
                    <p className="text-xs text-primary-dark/60 mt-0.5">{l.duration_min} min</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
