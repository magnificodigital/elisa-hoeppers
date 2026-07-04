import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Trash2, Eye } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";
import { ImageUploader } from "@/components/ImageUploader";
import { getPostForAdmin, updatePost, deletePost, parseMarkdownBlocks } from "@/lib/blog";

export const Route = createFileRoute("/admin/blog/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar post" }] }),
  component: () => (
    <StaffGuard>
      <PostEditPage />
    </StaffGuard>
  ),
});

const inputCls =
  "w-full border border-border rounded-md px-3 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function PostEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ["admin-post", id],
    queryFn: () => getPostForAdmin(id),
  });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    cover_image: null as string | null,
    body_md: "",
    author_name: "Elisa Hoeppers",
    is_published: false,
    published_at: "",
  });
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        cover_image: post.cover_image,
        body_md: post.body_md ?? "",
        author_name: post.author_name ?? "Elisa Hoeppers",
        is_published: post.is_published,
        published_at: post.published_at ? post.published_at.slice(0, 16) : "",
      });
    }
  }, [post]);

  const save = useMutation({
    mutationFn: () =>
      updatePost(id, {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        cover_image: form.cover_image,
        body_md: form.body_md || null,
        author_name: form.author_name || null,
        is_published: form.is_published,
        published_at: form.published_at
          ? new Date(form.published_at).toISOString()
          : form.is_published
            ? new Date().toISOString()
            : null,
      }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["admin-post", id] });
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      qc.invalidateQueries({ queryKey: ["blog-posts-home"] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const del = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      navigate({ to: "/admin/blog" });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <section className="py-24 text-center">
          <p className="text-[var(--text-muted)]">Carregando…</p>
        </section>
      </Layout>
    );
  }
  if (!post) {
    return (
      <Layout>
        <section className="py-24 text-center">
          <p className="text-[var(--text-muted)]">Post não encontrado.</p>
        </section>
      </Layout>
    );
  }

  const previewBlocks = parseMarkdownBlocks(form.body_md);

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to="/admin/blog"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary hover:opacity-70 mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-6">Editar post</h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="bg-white rounded-lg p-6 md:p-8 space-y-5"
          >
            <Field label="Título">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="Slug">
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className={inputCls}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">/blog/{form.slug}</p>
            </Field>

            <Field label="Resumo (excerpt)">
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={3}
                className={inputCls}
                maxLength={200}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{form.excerpt.length}/200</p>
            </Field>

            <Field label="Imagem de capa">
              <ImageUploader
                value={form.cover_image}
                folder="blog"
                aspectRatio="3/4"
                onChange={(url) => setForm({ ...form, cover_image: url })}
              />
            </Field>

            <Field label="Conteúdo (markdown)">
              <textarea
                value={form.body_md}
                onChange={(e) => setForm({ ...form, body_md: e.target.value })}
                rows={20}
                className={inputCls + " font-mono text-sm leading-relaxed"}
                placeholder={`Texto do parágrafo.\n\n## Título de seção\n\nOutro parágrafo.\n\n### Subtítulo\n\nMais texto.`}
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Use <code>##</code> pra título de seção, <code>###</code> pra subtítulo. Parágrafos separados por linha em branco.
              </p>
            </Field>

            <div>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary hover:opacity-70"
              >
                <Eye className="w-3.5 h-3.5" /> {showPreview ? "Esconder pré-visualização" : "Pré-visualizar"}
              </button>
              {showPreview && (
                <div className="mt-4 border border-border rounded-lg p-5 bg-cream/40">
                  {previewBlocks.map((b, i) => {
                    if (b.type === "h2")
                      return (
                        <h2 key={i} className="font-display text-xl text-primary-dark mt-4 mb-2">
                          {b.text}
                        </h2>
                      );
                    if (b.type === "h3")
                      return (
                        <h3 key={i} className="font-display text-lg text-primary-dark mt-3 mb-2">
                          {b.text}
                        </h3>
                      );
                    return (
                      <p key={i} className="text-primary-dark/90 leading-relaxed mb-3 whitespace-pre-line">
                        {b.text}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            <Field label="Autor">
              <input
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Publicado em (datetime)">
                <input
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                  className={inputCls}
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Deixe em branco pra usar a data atual ao publicar.
                </p>
              </Field>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  />
                  <span className="text-sm text-primary-dark">Publicado (visível no site)</span>
                </label>
              </div>
            </div>

            {save.error && <p className="text-red-700 text-sm">{(save.error as Error).message}</p>}

            <div className="flex items-center gap-3 pt-3 border-t border-border flex-wrap">
              <button
                type="submit"
                disabled={save.isPending}
                className="bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-60"
              >
                {save.isPending ? "Salvando…" : "Salvar"}
              </button>
              {saved && <span className="text-sm text-primary-dark">✓ Salvo</span>}
              <Link
                to="/blog/$slug"
                params={{ slug: form.slug }}
                target="_blank"
                className="ml-auto text-xs uppercase tracking-widest text-primary hover:opacity-70"
              >
                Ver no blog →
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Excluir post? Esta ação não pode ser desfeita.")) del.mutate();
                }}
                className="text-xs uppercase tracking-widest text-red-700 hover:opacity-70 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}
