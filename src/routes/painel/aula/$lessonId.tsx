import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { getLessonById, markLessonComplete, listLessonsWithProgress } from "@/lib/lessons";
import { isEnrolledInCourse } from "@/lib/enrollments";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/painel/aula/$lessonId")({
  loader: async ({ params }) => {
    const lesson = await getLessonById(params.lessonId);
    if (!lesson) throw notFound();
    const { data: course } = await supabase
      .from("courses")
      .select("id, slug, title")
      .eq("id", lesson.course_id)
      .maybeSingle();
    if (!course) throw notFound();
    return { lesson, course };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.lesson.title} — ${loaderData?.course.title}` }],
  }),
  component: LessonPlayerPage,
});

function LessonPlayerPage() {
  const { lesson, course } = Route.useLoaderData();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [marked, setMarked] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: `/painel/aula/${lesson.id}` } });
  }, [loading, user, lesson.id, navigate]);

  const { data: enrolled, isLoading: checking } = useQuery({
    queryKey: ["is-enrolled", user?.id, lesson.course_id],
    queryFn: () => isEnrolledInCourse(lesson.course_id),
    enabled: !!user,
  });

  const { data: allLessons } = useQuery({
    queryKey: ["lessons-with-progress", lesson.course_id, user?.id],
    queryFn: () => listLessonsWithProgress(lesson.course_id),
    enabled: !!user && !!enrolled,
  });

  const completeMutation = useMutation({
    mutationFn: () => markLessonComplete(lesson.id),
    onSuccess: () => {
      setMarked(true);
      qc.invalidateQueries({ queryKey: ["lessons-with-progress", lesson.course_id, user?.id] });
      qc.invalidateQueries({ queryKey: ["my-course-progress", user?.id] });
    },
  });

  if (loading || !user || checking) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark">Carregando…</p>
        </div>
      </Layout>
    );
  }

  if (!enrolled && !lesson.is_free_preview) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark mb-4">Você precisa estar matriculada para acessar esta aula.</p>
          <Link
            to="/cursos/$slug"
            params={{ slug: course.slug }}
            className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
          >
            Matricular-se
          </Link>
        </div>
      </Layout>
    );
  }

  const sortedLessons = (allLessons ?? []).slice().sort((a, b) => a.display_order - b.display_order);
  const currentIdx = sortedLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? sortedLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx >= 0 && currentIdx < sortedLessons.length - 1 ? sortedLessons[currentIdx + 1] : null;
  const isCompleted = marked || (sortedLessons.find((l) => l.id === lesson.id)?.completed ?? false);

  return (
    <Layout>
      <section className="py-12 bg-cream min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            to="/painel/curso/$slug"
            params={{ slug: course.slug }}
            className="text-xs uppercase tracking-widest text-primary-dark/70 hover:opacity-70"
          >
            ← {course.title}
          </Link>

          <h1 className="font-display text-2xl md:text-3xl text-primary-dark mt-3 mb-6">{lesson.title}</h1>

          {lesson.youtube_id ? (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${lesson.youtube_id}`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center mb-6">
              <p className="text-primary-dark/70">Vídeo em breve.</p>
            </div>
          )}

          {lesson.description && (
            <p className="text-primary-dark text-base leading-relaxed mb-6">{lesson.description}</p>
          )}

          {lesson.content_md && (
            <div className="prose prose-stone max-w-none mb-8 text-primary-dark">
              <pre className="whitespace-pre-wrap font-sans bg-white rounded-lg p-6">{lesson.content_md}</pre>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 mb-6 gap-3 flex-wrap">
            <div className="flex gap-2">
              {prevLesson && (
                <Link
                  to="/painel/aula/$lessonId"
                  params={{ lessonId: prevLesson.id }}
                  className="border border-primary text-primary px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition"
                >
                  ← Anterior
                </Link>
              )}
              {nextLesson && (
                <Link
                  to="/painel/aula/$lessonId"
                  params={{ lessonId: nextLesson.id }}
                  className="border border-primary text-primary px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition"
                >
                  Próxima →
                </Link>
              )}
            </div>

            <button
              onClick={() => completeMutation.mutate()}
              disabled={isCompleted || completeMutation.isPending}
              className={`px-6 py-2.5 rounded-full text-xs uppercase tracking-widest transition ${
                isCompleted ? "bg-primary-dark text-white" : "bg-primary text-white hover:bg-primary-dark"
              } disabled:opacity-80`}
            >
              {isCompleted ? "✓ Aula concluída" : completeMutation.isPending ? "Marcando..." : "Marcar como concluída"}
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
