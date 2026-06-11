import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { listAllPostsForAdmin, createPost } from "@/lib/blog";

export const Route = createFileRoute("/admin/blog/")({
  head: () => ({ meta: [{ title: "Admin — Blog" }] }),
  component: () => (
    <AdminGuard>
      <AdminBlogList />
    </AdminGuard>
  ),
});

function AdminBlogList() {
  const qc = useQueryClient();
  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: listAllPostsForAdmin,
  });

  const create = useMutation({
    mutationFn: () =>
      createPost({
        slug: `post-${Date.now().toString(36)}`,
        title: "Novo post",
        excerpt: null,
        cover_image: null,
        body_md: "",
        author_name: "Elisa Hoeppers",
        published_at: null,
        is_published: false,
        tags: [],
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-posts"] }),
  });

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            to="/admin/posts"
            className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition mb-5"
          >
            <ArrowLeft size={16} /> Voltar para Posts
          </Link>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="text-primary" size={22} />
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Blog</h1>
            </div>
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
            >
              <Plus className="w-4 h-4" /> Novo post
            </button>
          </div>
          <p className="text-primary-dark/70 mb-8">Gerencie os posts de Dicas e Novidades.</p>

          {isLoading && <p className="text-primary-dark/60">Carregando…</p>}

          <div className="space-y-3">
            {(posts ?? []).map((p) => (
              <div key={p.id} className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm">
                {p.cover_image ? (
                  <img src={p.cover_image} alt="" className="w-16 h-20 object-cover rounded" />
                ) : (
                  <div className="w-16 h-20 bg-cream rounded flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-dark/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-primary-dark truncate">{p.title}</h3>
                  <p className="text-xs text-primary-dark/60 truncate">/blog/{p.slug}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {p.is_published ? (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Publicado</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Rascunho</span>
                    )}
                    {p.published_at && (
                      <span className="text-primary-dark/60">
                        {new Date(p.published_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to="/admin/blog/$id"
                  params={{ id: p.id }}
                  className="text-xs uppercase tracking-widest text-primary hover:opacity-70 shrink-0"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
