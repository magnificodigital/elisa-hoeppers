import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { listMyCourseProgress } from "@/lib/enrollments";

export const Route = createFileRoute("/painel/")({
  head: () => ({ meta: [{ title: "Meu Painel — Elisa Hoeppers" }] }),
  component: PainelPage,
});

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

  return (
    <Layout>
      <section className="py-16 bg-cream min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Olá, {greeting}</h1>
              <p className="text-primary-dark/70 mt-1">Bem-vinda ao seu painel.</p>
            </div>
            <button
              onClick={() => signOut().then(() => navigate({ to: "/" }))}
              className="text-xs uppercase tracking-widest text-primary-dark hover:opacity-70"
            >
              Sair
            </button>
          </div>

          <h2 className="font-display text-2xl text-primary-dark mb-6">Meus cursos</h2>
          {isLoading && <p className="text-primary-dark/70">Carregando seus cursos…</p>}

          {!isLoading && (!progress || progress.length === 0) && (
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(progress ?? []).map((c) => {
              const pct = c.total_lessons > 0 ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0;
              return (
                <Link
                  key={c.course_id}
                  to="/painel/curso/$slug"
                  params={{ slug: c.course_slug }}
                  className="block group bg-white rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  {c.cover_image && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-primary-dark">
                      <img
                        src={c.cover_image}
                        alt={c.course_title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="font-display text-lg text-primary-dark">{c.course_title}</h3>
                      <p className="text-xs text-primary-dark/60 mt-1">
                        {c.completed_lessons} de {c.total_lessons} aulas concluídas
                      </p>
                    </div>
                    <div>
                      <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-primary-dark/60 mt-2">{pct}% concluído</p>
                    </div>
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
