import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, FileText, Image, Trash2, Globe, Calendar, Settings } from "lucide-react";
import { toast } from "sonner";
import { getPostForAdmin, updatePost, deletePost, type Post } from "@/lib/blog";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/blog/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar Post" }] }),
  component: () => <EditPostPage />,
});

function EditPostPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  
  const { data: post, isLoading } = useQuery({
    queryKey: ["admin-post", id],
    queryFn: () => getPostForAdmin(id),
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setSlug(post.slug || "");
      setExcerpt(post.excerpt || "");
      setBodyMd(post.body_md || "");
      setCoverImage(post.cover_image || "");
      setIsPublished(post.is_published || false);
    }
  }, [post]);

  const save = useMutation({
    mutationFn: (patch: any) => updatePost(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-post", id] });
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post salvo com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post excluído");
      navigate({ to: "/admin/blog" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !post) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/blog" 
              className="p-2 hover:bg-white rounded-lg text-primary-dark/60 transition"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-display text-primary-dark">{title || "Sem título"}</h1>
              <p className="text-xs text-primary-dark/40 uppercase tracking-widest">/blog/{slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => remove.mutate()}
              className="p-2 text-primary-dark/40 hover:text-red-500 transition"
              title="Excluir Post"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => save.mutate({ title, slug, excerpt, body_md: bodyMd, cover_image: coverImage, is_published: isPublished })}
              disabled={save.isPending}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition shadow-sm disabled:opacity-50"
            >
              {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Post
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 mb-1.5">Título do Post</label>
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-cream/20 border border-border rounded-lg px-4 py-3 text-lg font-display text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Título cativante..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 mb-1.5">Resumo (opcional)</label>
                <textarea 
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full bg-cream/20 border border-border rounded-lg px-4 py-3 text-sm text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Um breve resumo para a listagem..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 mb-1.5">Conteúdo (Markdown)</label>
                <textarea 
                  value={bodyMd}
                  onChange={(e) => setBodyMd(e.target.value)}
                  rows={15}
                  className="w-full bg-cream/20 border border-border rounded-lg px-4 py-3 text-sm text-primary-dark font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Escreva seu post usando Markdown..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 mb-3 flex items-center gap-2">
                  <Globe size={14} /> Publicação
                </label>
                <div className="flex items-center justify-between p-3 bg-cream/10 rounded-xl border border-border/50">
                  <span className="text-xs font-medium text-primary-dark">Visível no Site</span>
                  <Switch 
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 mb-1.5 flex items-center gap-2">
                  <Settings size={14} /> Slug do Post
                </label>
                <input 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-cream/20 border border-border rounded-lg px-3 py-2 text-xs text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="minha-dica-de-yoga"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 mb-3 flex items-center gap-2">
                  <Image size={14} /> Imagem de Capa
                </label>
                {coverImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border mb-3">
                    <img src={coverImage} alt="Capa" className="w-full aspect-video object-cover" />
                    <button 
                      onClick={() => setCoverImage("")}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="aspect-video bg-cream/30 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-primary-dark/30 gap-2 mb-3">
                    <Image size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sem Imagem</span>
                  </div>
                )}
                <input 
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full bg-cream/20 border border-border rounded-lg px-3 py-2 text-[10px] text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="URL da imagem..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
