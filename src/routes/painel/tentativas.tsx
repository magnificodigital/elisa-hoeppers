import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

type AttemptRow = {
  id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  attempted_at: string;
  quiz: {
    title: string;
    lesson: { id: string; title: string; course: { slug: string; title: string } };
  };
};

async function listMyAttemptsFull(): Promise<AttemptRow[]> {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(`
      id, score, correct_count, total_questions, passed, attempted_at,
      quiz:quizzes (
        title,
        lesson:lessons (
          id, title,
          course:courses ( slug, title )
        )
      )
    `)
    .order("attempted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AttemptRow[];
}

export const Route = createFileRoute("/painel/tentativas")({
  head: () => ({ meta: [{ title: "Minhas tentativas — Elisa Hoeppers" }] }),
  component: AttemptsPage,
});

function AttemptsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: "/painel/tentativas" } });
  }, [loading, user, navigate]);

  const { data: attempts, isLoading } = useQuery({
    queryKey: ["my-quiz-attempts-all", user?.id],
    queryFn: listMyAttemptsFull,
    enabled: !!user,
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

  return (
    <Layout>
      <section className="py-10 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4">
          <Link to="/painel" className="text-xs uppercase tracking-widest text-primary hover:opacity-70">
            ← Voltar ao painel
          </Link>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <ClipboardList className="text-primary" size={24} />
            <h1 className="font-display text-3xl text-primary-dark">Tentativas de questionários</h1>
          </div>
          <p className="text-sm text-primary-dark/70 mb-8">
            Histórico das suas tentativas em todos os quizzes.
          </p>

          {isLoading && <p className="text-primary-dark/70">Carregando…</p>}

          {!isLoading && (attempts?.length ?? 0) === 0 && (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-primary-dark">Você ainda não fez nenhum questionário.</p>
            </div>
          )}

          <div className="space-y-3">
            {(attempts ?? []).map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg p-5 flex items-center gap-4 hover:shadow-sm transition"
              >
                {a.passed ? (
                  <CheckCircle2 className="text-green-600 shrink-0" size={28} />
                ) : (
                  <XCircle className="text-red-500 shrink-0" size={28} />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-primary-dark truncate">{a.quiz.title}</h3>
                  <p className="text-xs text-primary-dark/60 truncate">
                    {a.quiz.lesson.course.title} · {a.quiz.lesson.title}
                  </p>
                  <p className="text-[11px] text-primary-dark/50 mt-1">
                    {new Date(a.attempted_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-2xl text-primary-dark">{a.score}%</p>
                  <p className="text-xs text-primary-dark/50">
                    {a.correct_count}/{a.total_questions}
                  </p>
                </div>
                <Link
                  to="/painel/aula/$lessonId"
                  params={{ lessonId: a.quiz.lesson.id }}
                  className="text-xs uppercase tracking-widest text-primary hover:opacity-70 shrink-0"
                >
                  Revisar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
