import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ExternalLink, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPage, deletePage, listPages, slugify } from "@/lib/pages";

export const Route = createFileRoute("/admin/site/paginas/")({
  head: () => ({ meta: [{ title: "Admin — Páginas do site" }] }),
  component: () => (
    
      <PagesListPage />
    
  ),
});

function PagesListPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const { data: pages, isLoading } = useQuery({ queryKey: ["pages"], queryFn: listPages });

  const create = useMutation({
    mutationFn: async () => {
      const finalSlug = slugify(slug || title);
      if (!title.trim()) throw new Error("Informe o título da página");
      if (!finalSlug) throw new Error("Endereço inválido");
      return createPage({ title: title.trim(), slug: finalSlug });
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["pages"] });
      setTitle("");
      setSlug("");
      navigate({ to: "/admin/site/paginas/$id", params: { id: p.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deletePage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Página excluída");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inputCls =
    "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/site" className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition mb-5">
            <ArrowLeft size={16} /> Voltar para Site
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Páginas</h1>
          <p className="text-primary-dark/70 mb-8">
            Crie e edite páginas de conteúdo do site. Elas ficam disponíveis em <code>/p/endereço</code>.
          </p>

          <div className="bg-white rounded-xl p-5 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-primary-dark mb-3">Nova página</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Título (ex.: Perguntas frequentes)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
              <input
                placeholder="Endereço (ex.: faq)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={inputCls}
              />
            </div>
            <p className="text-xs text-primary-dark/50 mt-2">
              Endereço final: /p/{slugify(slug || title) || "…"}
            </p>
            <div className="flex justify-end mt-3">
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending}
                className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
              >
                {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Criar página
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (pages ?? []).length === 0 ? (
            <p className="text-sm text-primary-dark/50 py-10 text-center bg-white rounded-xl">
              Nenhuma página criada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {(pages ?? []).map((p) => (
                <div key={p.id} className="bg-white rounded-lg p-4 flex items-center gap-3">
                  <FileText size={18} className="text-primary shrink-0" />
                  <Link
                    to="/admin/site/paginas/$id"
                    params={{ id: p.id }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-primary-dark truncate">{p.title}</p>
                    <p className="text-xs text-primary-dark/50 truncate">/p/{p.slug}</p>
                  </Link>
                  <span
                    className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      p.is_published ? "bg-primary/10 text-primary" : "bg-sand text-primary-dark/60"
                    }`}
                  >
                    {p.is_published ? "Publicada" : "Rascunho"}
                  </span>
                  <a
                    href={`/p/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-dark/40 hover:text-primary transition"
                    aria-label="Abrir página"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir a página "${p.title}"?`)) del.mutate(p.id);
                    }}
                    className="text-primary-dark/40 hover:text-red-600 transition"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    
  );
}
