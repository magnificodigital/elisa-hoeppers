import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { listMyEnrollments } from "@/lib/enrollments";

export const Route = createFileRoute("/painel")({
  head: () => ({ meta: [{ title: "Meu Painel — Elisa Hoeppers" }] }),
  component: PainelPage,
});

function PainelPage() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: "/painel" } });
  }, [loading, user, navigate]);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: listMyEnrollments,
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
          {!isLoading && (!enrollments || enrollments.length === 0) && (
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
            {(enrollments ?? []).map((e) => (
              <Link
                key={e.id}
                to="/cursos/$slug"
                params={{ slug: e.course.slug }}
                className="block group"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-primary-dark">
                  {e.course.cover_image && (
                    <img
                      src={e.course.cover_image}
                      alt={e.course.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                    <span className="font-display text-white text-2xl">
                      {e.course.overlay_label ?? e.course.title}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-primary-dark">{e.course.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
