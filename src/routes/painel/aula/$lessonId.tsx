import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Menu, CheckCircle, X, Award, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLessonWithCourse, markLessonComplete, listLessonsWithProgress, isCourseJustCompleted, groupLessonsByModule } from "@/lib/lessons";
import { getMyCertificateForCourse } from "@/lib/certificates";
import { supabase } from "@/lib/supabase";
import { isEnrolledInCourse } from "@/lib/enrollments";
import { LessonQuiz } from "@/components/LessonQuiz";
import { LessonQA } from "@/components/LessonQA";

export const Route = createFileRoute("/painel/aula/$lessonId")({
  head: () => ({ meta: [{ title: "Aula — Elisa Hoeppers" }] }),
  component: LessonPlayerPage,
});

function LessonPlayerPage() {
  const { lessonId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [marked, setMarked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: lessonData, isLoading: loadingLesson, error: lessonError } = useQuery({
    queryKey: ["lesson-with-course", lessonId],
    queryFn: () => getLessonWithCourse(lessonId),
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: `/painel/aula/${lessonId}` } });
  }, [loading, user, lessonId, navigate]);

  const lesson = lessonData;
  const course = lessonData?.course;

  const { data: enrolled, isLoading: checking } = useQuery({
    queryKey: ["is-enrolled", user?.id, lesson?.course_id],
    queryFn: () => isEnrolledInCourse(lesson!.course_id),
    enabled: !!user && !!lesson,
  });

  const { data: allLessons } = useQuery({
    queryKey: ["lessons-with-progress", lesson?.course_id, user?.id],
    queryFn: () => listLessonsWithProgress(lesson!.course_id),
    enabled: !!lesson,
  });

  const lessonsCompletedCount = (allLessons ?? []).filter((l) => l.completed).length;
  const lessonsTotalCount = (allLessons ?? []).length;

  const { data: certificate } = useQuery({
    queryKey: ["my-certificate", user?.id, lesson?.course_id],
    queryFn: () => getMyCertificateForCourse(lesson!.course_id),
    enabled: !!user && !!lesson && lessonsTotalCount > 0 && lessonsCompletedCount === lessonsTotalCount,
  });



  const completeMutation = useMutation({
    mutationFn: () => markLessonComplete(lesson!.id),
    onSuccess: async () => {
      setMarked(true);
      qc.invalidateQueries({ queryKey: ["lessons-with-progress", lesson?.course_id, user?.id] });
      qc.invalidateQueries({ queryKey: ["my-course-progress", user?.id] });
      qc.invalidateQueries({ queryKey: ["my-certificates", user?.id] });

      if (lesson?.course_id) {
        try {
          const result = await isCourseJustCompleted(lesson.course_id);
          if (result.completed && result.certificateId) {
            supabase.functions.invoke("send-notification", {
              body: { type: "course_completed", record_id: result.certificateId },
            }).catch((e) => console.error("course email failed:", e));
          }
        } catch (e) {
          console.error("check course completion:", e);
        }
      }
    },
  });

  // YouTube Player API — auto-marca aula como concluída quando vídeo termina
  useEffect(() => {
    if (!playing || !lesson?.youtube_id) return;

    const w = window as any;
    if (!w.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    function attachPlayer() {
      if (!w.YT?.Player) return;
      new w.YT.Player("lesson-yt-player", {
        events: {
          onStateChange: (e: any) => {
            if (e.data === 0 && !isCompleted) {
              completeMutation.mutate();
            }
          },
        },
      });
    }

    if (w.YT?.Player) {
      setTimeout(attachPlayer, 100);
    } else {
      w.onYouTubeIframeAPIReady = attachPlayer;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, lesson?.youtube_id]);


  if (loadingLesson || loading || (!user && !loading)) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <div className="flex-grow flex items-center justify-center">
          <p className="text-primary-dark">Carregando…</p>
        </div>
      </div>
    );
  }

  if (lessonError || !lesson || !course) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <div className="flex-grow flex items-center justify-center">
          <p className="text-primary-dark">Aula não encontrada.</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!enrolled && !lesson.is_free_preview) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <div className="flex-grow flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-primary-dark mb-4">Você precisa estar matriculada para acessar esta aula.</p>
            <Link
              to="/cursos/$slug"
              params={{ slug: course.slug }}
              className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
            >
              Matricular-se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sortedLessons = (allLessons ?? []).slice().sort((a, b) => a.display_order - b.display_order);
  const currentIdx = sortedLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? sortedLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx >= 0 && currentIdx < sortedLessons.length - 1 ? sortedLessons[currentIdx + 1] : null;

  const progressCompleted = sortedLessons.filter((l) => l.completed).length;
  const progressTotal = sortedLessons.length;
  const progressPct = progressTotal > 0 ? Math.round((progressCompleted / progressTotal) * 100) : 0;
  const isCompleted = marked || (sortedLessons.find((l) => l.id === lesson.id)?.completed ?? false);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Header bar verde escuro */}
      <header className="bg-[#3B4F30] text-cream flex items-center justify-between px-4 md:px-6 py-3 gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/painel"
            className="shrink-0 text-cream/90 hover:text-cream transition"
            aria-label="Voltar ao painel"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-medium truncate max-w-[12rem] md:max-w-xs">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="md:hidden inline-flex items-center gap-1.5 text-cream/90 hover:text-cream border border-cream/30 rounded-full px-3 py-1.5"
            aria-label="Ver conteúdo do curso"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-widest">Conteúdo</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm text-cream/90">
            <span className="text-cream/70">Seu Progresso:</span>
            <span className="font-medium">
              {progressCompleted} de {progressTotal}
            </span>
            <span className="text-cream/70">({progressPct}%)</span>
          </div>

          <button
            onClick={() => completeMutation.mutate()}
            disabled={isCompleted || completeMutation.isPending}
            className={`inline-flex items-center gap-2 border px-4 md:px-5 py-2 rounded-full text-[11px] md:text-xs uppercase tracking-widest transition ${
              isCompleted
                ? "border-cream/40 text-cream/60 cursor-default"
                : "border-cream text-cream hover:bg-cream hover:text-primary"
            } disabled:opacity-80`}
          >
            <CheckCircle className="w-4 h-4" />
            {isCompleted ? "Concluído" : completeMutation.isPending ? "Marcando..." : "Marcar como concluído"}
          </button>

          <Link
            to="/painel"
            className="hidden md:inline-flex text-cream/70 hover:text-cream transition"
            aria-label="Fechar aula"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden md:w-full md:max-w-7xl md:mx-auto md:px-4 md:gap-8">
        {/* Sidebar de aulas */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:sticky top-12 md:top-0 left-0 z-30 w-[280px] md:w-64 h-[calc(100vh-3rem)] md:h-auto md:self-start bg-cream p-3 md:py-6 md:px-0 transition-transform duration-300 ease-in-out md:transition-none flex flex-col`}
        >
         <div className="bg-white rounded-xl shadow-sm flex flex-col h-full md:h-auto md:max-h-[calc(100vh-6rem)] overflow-hidden">
          <div className="px-5 py-4 border-b border-cream">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase tracking-widest text-[#5E6B5A] font-semibold">
                Conteúdo do curso
              </h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-primary-dark/60 hover:text-primary-dark"
                aria-label="Fechar conteúdo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-display text-lg text-primary-dark leading-snug">
              {course.title}
            </p>

            <div className="flex items-baseline justify-between mt-4 mb-2">
              <span className="text-[11px] text-[#5E6B5A]">
                {progressCompleted} de {progressTotal} aulas
              </span>
              <span className="text-sm font-display text-primary-dark">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-cream rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>

            {(() => {
              const next = sortedLessons.find((l) => !l.completed);
              if (!next || next.id === lesson.id) return null;
              return (
                <Link
                  to="/painel/aula/$lessonId"
                  params={{ lessonId: next.id }}
                  onClick={() => setSidebarOpen(false)}
                  className="block w-full text-center bg-primary text-white px-4 py-2 rounded-full uppercase tracking-[0.15em] text-[10px] font-semibold hover:bg-primary-dark transition"
                >
                  {progressCompleted === 0 ? "Começar agora" : "Continuar de onde parou"}
                </Link>
              );
            })()}

            {certificate && (
              <Link
                to="/certificado/$code"
                params={{ code: certificate.code }}
                className="mt-3 flex items-center justify-center gap-2 w-full bg-primary/10 border border-primary/30 text-primary-dark px-4 py-2 rounded-full uppercase tracking-[0.15em] text-[10px] font-semibold hover:bg-primary/20 transition"
              >
                <Award className="w-3.5 h-3.5" />
                Ver certificado
              </Link>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {sortedLessons.map((l, i) => {
              const isCurrent = l.id === lesson.id;
              return (
                <Link
                  key={l.id}
                  to="/painel/aula/$lessonId"
                  params={{ lessonId: l.id }}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-md text-sm transition-colors ${
                    isCurrent
                      ? "bg-primary text-cream font-medium"
                      : "text-primary-dark hover:bg-cream/60"
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-medium ${
                      isCurrent
                        ? "bg-cream/20 text-cream"
                        : l.completed
                        ? "bg-primary text-white"
                        : "bg-cream text-primary-dark"
                    }`}
                  >
                    {l.completed ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate leading-snug">
                      {l.title}
                    </p>
                    {l.duration_min && (
                      <p className={`text-[11px] mt-0.5 ${isCurrent ? "text-cream/70" : "text-[#5E6B5A]"}`}>
                        {l.duration_min} min
                      </p>
                    )}

                  </div>
                </Link>
              );
            })}
          </nav>
         </div>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Área principal */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-4xl mx-auto px-4 md:px-0 py-6">
            {lesson.youtube_id ? (
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-8">
                {playing ? (
                  <iframe
                    id="lesson-yt-player"
                    src={`https://www.youtube.com/embed/${lesson.youtube_id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                ) : (
                  <button
                    onClick={() => setPlaying(true)}
                    aria-label="Reproduzir aula"
                    className="absolute inset-0 w-full h-full group cursor-pointer"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${lesson.youtube_id}/maxresdefault.jpg`}
                      alt={lesson.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${lesson.youtube_id}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                      <span className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <svg className="w-10 h-10 text-primary-dark ml-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center mb-8">
                <p className="text-[var(--text-muted)]">Vídeo em breve.</p>
              </div>
            )}

            <h1 className="font-display text-2xl md:text-3xl text-primary-dark mb-6">{lesson.title}</h1>

            {(lesson.description || lesson.content_md) && (
              <section className="mb-10">
                <h2 className="text-base font-semibold text-primary-dark mb-3 uppercase tracking-wider text-xs">Sobre a Aula</h2>
                {lesson.description && (
                  <p className="text-primary-dark/90 text-base leading-relaxed mb-4">{lesson.description}</p>
                )}
                {lesson.content_md && (
                  <pre className="whitespace-pre-wrap font-sans bg-white rounded-lg p-5 text-primary-dark/90 text-sm leading-relaxed">{lesson.content_md}</pre>
                )}
              </section>
            )}

            {/* Navegação anterior/próxima */}
            <LessonQuiz lessonId={lesson.id} onPassed={() => completeMutation.mutate()} />

            <LessonQA lessonId={lesson.id} />

            {/* Navegação anterior/próxima */}
            <div className="flex items-center justify-center gap-3 mt-12 pb-8">
              {prevLesson ? (
                <Link
                  to="/painel/aula/$lessonId"
                  params={{ lessonId: prevLesson.id }}
                  className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Anterior
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 border border-border text-[var(--text-muted)] px-6 py-2.5 rounded-full text-xs uppercase tracking-widest cursor-not-allowed">
                  Anterior
                </span>
              )}
              {nextLesson ? (
                <Link
                  to="/painel/aula/$lessonId"
                  params={{ lessonId: nextLesson.id }}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition"
                >
                  Próximo
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 border border-border text-[var(--text-muted)] px-6 py-2.5 rounded-full text-xs uppercase tracking-widest cursor-not-allowed">
                  Próximo
                </span>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
