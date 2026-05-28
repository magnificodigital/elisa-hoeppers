import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { listMyQuestions } from "@/lib/qa";

export const Route = createFileRoute("/painel/perguntas")({
  head: () => ({ meta: [{ title: "Minhas perguntas — Elisa Hoeppers" }] }),
  component: MyQuestionsPage,
});

function MyQuestionsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: "/painel/perguntas" } });
  }, [loading, user, navigate]);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["my-questions", user?.id],
    queryFn: listMyQuestions,
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
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/painel" className="text-xs uppercase tracking-widest text-primary hover:opacity-70 mb-4 inline-block">
            ← Voltar ao painel
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl md:text-3xl text-primary-dark">Minhas perguntas</h1>
          </div>
          <p className="text-primary-dark/70 mb-8">Histórico de perguntas que você fez nas aulas.</p>

          {isLoading && <p className="text-primary-dark">Carregando…</p>}

          {!isLoading && (questions?.length ?? 0) === 0 && (
            <div className="bg-white rounded-lg p-10 text-center">
              <MessageCircle className="w-10 h-10 text-primary/40 mx-auto mb-3" />
              <p className="text-primary-dark mb-4">Você ainda não fez nenhuma pergunta.</p>
              <Link to="/painel" className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition">
                Ir pra meus cursos
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {(questions ?? []).map((q) => (
              <article key={q.id} className="bg-white rounded-lg p-5 border border-border">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-primary-dark leading-relaxed whitespace-pre-line mb-1">{q.body}</p>
                    {q.lesson && (
                      <p className="text-xs text-[var(--text-muted)]">
                        em <span className="text-primary-dark">{q.lesson.title}</span>
                        {q.lesson.course && <> · {q.lesson.course.title}</>}
                      </p>
                    )}
                  </div>
                  {q.is_resolved && (
                    <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded inline-flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Resolvida
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-3">
                  <span>
                    {new Date(q.created_at).toLocaleString("pt-BR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>{q.answer_count} {q.answer_count === 1 ? "resposta" : "respostas"}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
