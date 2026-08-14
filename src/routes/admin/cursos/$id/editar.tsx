import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { ImageUploader } from "@/components/ImageUploader";
import { getCourseForAdmin, updateCourse, type CourseUpdate } from "@/lib/admin";

export const Route = createFileRoute("/admin/cursos/$id/editar")({
  head: () => ({ meta: [{ title: "Admin — Editar curso" }] }),
  component: () => (
    <StaffGuard>
      <CourseEditPage />
    </StaffGuard>
  ),
});

function CourseEditPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["admin-course", id],
    queryFn: () => getCourseForAdmin(id),
  });

  const [form, setForm] = useState<CourseUpdate>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title,
        slug: course.slug,
        subtitle: course.subtitle ?? "",
        description: course.description ?? "",
        cover_image: course.cover_image ?? "",
        overlay_label: course.overlay_label ?? "",
        level: course.level,
        price_cents: course.price_cents,
        is_published: course.is_published,
        display_order: course.display_order,
      });
    }
  }, [course]);

  const saveMutation = useMutation({
    mutationFn: () => updateCourse(id, form),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["admin-course", id] });
      qc.invalidateQueries({ queryKey: ["courses", "published"] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Carregando…</p></section>
      </Layout>
    );
  }
  if (!course) {
    return (
      <Layout>
        <section className="py-24 text-center"><p className="text-[var(--text-muted)]">Curso não encontrado.</p></section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20 bg-bodyoga-cream min-h-screen">
        <div className="container mx-auto px-6 max-w-3xl">
          <Link to="/admin/cursos" className="text-xs uppercase tracking-widest text-primary hover:opacity-70">← Voltar</Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mt-3 mb-6">Editar curso</h1>

          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="bg-white rounded-lg p-6 md:p-8 space-y-5 shadow-none border border-border/20">
            <Field label="Título">
              <input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required />
            </Field>
            <Field label="Slug (URL)">
              <input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} required />
            </Field>
            <Field label="Subtítulo">
              <input value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Descrição">
              <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} className={inputCls} />
            </Field>
            <Field label="Imagem de capa">
              <ImageUploader
                value={form.cover_image ?? null}
                onChange={(url) => setForm({ ...form, cover_image: url ?? "" })}
                folder="courses"
                aspectRatio="4/3"
              />
            </Field>
            <Field label="Texto grande do card (overlay)">
              <input value={form.overlay_label ?? ""} onChange={(e) => setForm({ ...form, overlay_label: e.target.value })} className={inputCls} placeholder="Ex.: YOGA, BODYOGA" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nível">
                <select value={form.level ?? "todos"} onChange={(e) => setForm({ ...form, level: e.target.value as CourseUpdate["level"] })} className={inputCls}>
                  <option value="todos">Todos os níveis</option>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </Field>
              <Field label="Ordem">
                <input type="number" value={form.display_order ?? 0} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className={inputCls} />
              </Field>
            </div>
            <Field label="Preço (em centavos, vazio = grátis)">
              <input type="number" value={form.price_cents ?? ""} onChange={(e) => setForm({ ...form, price_cents: e.target.value ? parseInt(e.target.value) : null })} className={inputCls} placeholder="Ex.: 9990 = R$ 99,90" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              <span className="text-sm text-primary-dark">Publicado (visível no site)</span>
            </label>

            {saveMutation.error && <p className="text-red-700 text-sm">{(saveMutation.error as Error).message}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saveMutation.isPending}
                className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60">
                {saveMutation.isPending ? "Salvando…" : "Salvar"}
              </button>
              {saved && <span className="text-sm text-primary-dark">✓ Salvo</span>}
              <Link to="/admin/cursos/$id/aulas" params={{ id }} className="ml-auto text-xs uppercase tracking-widest text-primary hover:opacity-70">
                Gerenciar aulas →
              </Link>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}

const inputCls = "w-full border border-border rounded-md px-4 py-2.5 bg-white text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-primary-dark mb-1.5">{label}</label>
      {children}
    </div>
  );
}
