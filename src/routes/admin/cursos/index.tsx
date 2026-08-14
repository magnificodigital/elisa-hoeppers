import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { listAllCourses, createCourse, slugify } from "@/lib/admin";

export const Route = createFileRoute("/admin/cursos/")({
  head: () => ({ meta: [{ title: "Admin — Cursos" }] }),
  component: () => (
    <StaffGuard>
      <AdminCursosList />
    </StaffGuard>
  ),
});

function AdminCursosList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: listAllCourses,
  });

  const createMutation = useMutation({
    mutationFn: () => createCourse({ title, slug: slug || slugify(title) }),
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      setShowNew(false);
      setTitle("");
      setSlug("");
      navigate({ to: "/admin/cursos/$id/editar", params: { id: course.id } });
    },
  });

  return (
    <Layout>
      <section className="py-8 md:py-20 bg-bodyoga-cream min-h-screen">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Cursos</h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">Gerencie os cursos da plataforma</p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="bg-primary text-white px-5 py-3 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark transition inline-flex items-center justify-center gap-2 shrink-0"
            >
              <Plus size={16} /> Novo curso
            </button>
          </div>

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          {!isLoading && (courses ?? []).length === 0 && (
            <div className="bg-bodyoga-cream border border-border/20 rounded-lg p-10 text-center">
              <p className="text-[var(--text-muted)] mb-4">Nenhum curso ainda.</p>
              <button
                onClick={() => setShowNew(true)}
                className="bg-primary text-white px-6 py-3 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-primary-dark transition inline-flex items-center gap-2"
              >
                <Plus size={16} /> Criar primeiro curso
              </button>
            </div>
          )}

          <div className="grid gap-4">
            {(courses ?? []).map((c) => (
              <div key={c.id} className="bg-bodyoga-cream border border-border/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-none">
                {c.cover_image && (
                  <img src={c.cover_image} alt="" className="w-full sm:w-24 h-40 sm:h-20 object-cover rounded" />
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
                <div className="flex gap-2 shrink-0">
                  <Link to="/admin/cursos/$id/editar" params={{ id: c.id }} className="flex-1 sm:flex-none text-center text-xs uppercase tracking-widest text-primary hover:opacity-70 px-3 py-2 border border-border rounded-full sm:border-0">
                    Editar
                  </Link>
                  <Link to="/admin/cursos/$id/aulas" params={{ id: c.id }} className="flex-1 sm:flex-none text-center bg-primary text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition">
                    Aulas
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-primary-dark">Novo curso</h2>
              <button onClick={() => setShowNew(false)} className="text-[var(--text-muted)] hover:text-primary-dark">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs uppercase tracking-widest text-primary-dark mb-1.5">Título</label>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug || slug === slugify(title)) setSlug(slugify(e.target.value));
                  }}
                  className={inputCls}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-primary-dark mb-1.5">Slug (URL)</label>
                <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className={inputCls} required />
              </div>
              {createMutation.error && (
                <p className="text-red-700 text-sm">{(createMutation.error as Error).message}</p>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60"
              >
                {createMutation.isPending ? "Criando…" : "Criar e editar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const inputCls =
  "w-full border border-border rounded-md px-4 py-2.5 bg-white text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary text-sm";
