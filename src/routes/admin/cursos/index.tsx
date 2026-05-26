import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { listAllCourses } from "@/lib/admin";

export const Route = createFileRoute("/admin/cursos/")({
  head: () => ({ meta: [{ title: "Admin — Cursos" }] }),
  component: () => (
    <AdminGuard>
      <AdminCursosList />
    </AdminGuard>
  ),
});

function AdminCursosList() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: listAllCourses,
  });

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-[var(--surface-cream)] min-h-screen">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Cursos</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Gerencie os cursos da plataforma</p>
          </div>

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          <div className="grid gap-4">
            {(courses ?? []).map((c) => (
              <div key={c.id} className="bg-white rounded-lg p-4 flex items-center gap-4">
                {c.cover_image && (
                  <img src={c.cover_image} alt="" className="w-24 h-20 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-primary-dark truncate">{c.title}</h3>
                  <p className="text-xs text-[var(--text-muted)]">/cursos/{c.slug}</p>
                  <div className="flex gap-2 mt-1 text-[10px] uppercase tracking-widest">
                    {c.is_published ? (
                      <span className="text-primary-dark">Publicado</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Rascunho</span>
                    )}
                    <span className="text-[var(--text-muted)]">Ordem {c.display_order}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/admin/cursos/$id/editar" params={{ id: c.id }} className="text-xs uppercase tracking-widest text-primary hover:opacity-70 px-3 py-2">
                    Editar
                  </Link>
                  <Link to="/admin/cursos/$id/aulas" params={{ id: c.id }} className="bg-primary text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition">
                    Aulas
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
