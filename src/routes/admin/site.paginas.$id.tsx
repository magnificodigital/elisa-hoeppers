import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { ImageUploader } from "@/components/ImageUploader";
import { PageBuilder } from "@/components/admin/PageBuilder";
import { markdownToBlocks, type PageBlock } from "@/lib/page-blocks";
import { getPage, updatePage, slugify, type SitePage } from "@/lib/pages";

export const Route = createFileRoute("/admin/site/paginas/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar página" }] }),
  component: () => (
    <AdminGuard>
      <PageEditor />
    </AdminGuard>
  ),
});

function PageEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["page", id], queryFn: () => getPage(id) });

  const [form, setForm] = useState<Partial<SitePage>>({});
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm(data);
    const existing = Array.isArray(data.content_blocks) ? data.content_blocks : [];
    setBlocks(existing.length > 0 ? existing : markdownToBlocks(data.content_md ?? ""));
  }, [data]);

  const set = (patch: Partial<SitePage>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.title?.trim()) return toast.error("Informe o título");
    const finalSlug = slugify(form.slug ?? "");
    if (!finalSlug) return toast.error("Endereço inválido");
    setSaving(true);
    try {
      await updatePage(id, {
        title: form.title.trim(),
        slug: finalSlug,
        content_md: form.content_md ?? "",
        hero_image: form.hero_image ?? null,
        seo_title: form.seo_title ?? null,
        seo_description: form.seo_description ?? null,
        is_published: !!form.is_published,
        show_in_menu: !!form.show_in_menu,
        display_order: Number(form.display_order ?? 0),
      });
      await qc.invalidateQueries({ queryKey: ["page", id] });
      await qc.invalidateQueries({ queryKey: ["pages"] });
      await qc.invalidateQueries({ queryKey: ["menu-pages"] });
      toast.success("Página salva");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-24 bg-cream min-h-[70vh]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="py-24 text-center bg-cream min-h-[70vh]">
          <p className="text-primary-dark/60">Página não encontrada.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5 gap-3">
            <Link to="/admin/site/paginas" className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition">
              <ArrowLeft size={16} /> Voltar para Páginas
            </Link>
            <a
              href={`/p/${data.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition"
            >
              Ver página <ExternalLink size={14} />
            </a>
          </div>

          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-6">Editar página</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Título</label>
                    <input value={form.title ?? ""} onChange={(e) => set({ title: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Endereço</label>
                    <input value={form.slug ?? ""} onChange={(e) => set({ slug: e.target.value })} className={inputCls} />
                    <p className="text-xs text-primary-dark/50 mt-1">/p/{slugify(form.slug ?? "")}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Conteúdo</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TOOLS.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => applyTool(t)}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-border text-primary-dark hover:bg-cream transition"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    id="page-content"
                    rows={18}
                    value={form.content_md ?? ""}
                    onChange={(e) => set({ content_md: e.target.value })}
                    className={`${inputCls} font-mono text-xs leading-relaxed`}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-5">
                <p className="text-[10px] uppercase tracking-widest text-primary-dark mb-3">Prévia</p>
                <MarkdownContent content={form.content_md ?? ""} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 space-y-3">
                <label className="flex items-center gap-2 text-sm text-primary-dark">
                  <input
                    type="checkbox"
                    checked={!!form.is_published}
                    onChange={(e) => set({ is_published: e.target.checked })}
                  />
                  Publicada
                </label>
                <label className="flex items-center gap-2 text-sm text-primary-dark">
                  <input
                    type="checkbox"
                    checked={!!form.show_in_menu}
                    onChange={(e) => set({ show_in_menu: e.target.checked })}
                  />
                  Mostrar no menu do site
                </label>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Ordem</label>
                  <input
                    type="number"
                    value={form.display_order ?? 0}
                    onChange={(e) => set({ display_order: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={save}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </div>

              <div className="bg-white rounded-xl p-5 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-primary-dark">Imagem de capa</p>
                <ImageUploader
                  value={form.hero_image ?? null}
                  onChange={(url) => set({ hero_image: url })}
                  folder="pages"
                  aspectRatio="16/9"
                />
              </div>

              <div className="bg-white rounded-xl p-5 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-primary-dark">SEO</p>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Título (Google)</label>
                  <input value={form.seo_title ?? ""} onChange={(e) => set({ seo_title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Descrição</label>
                  <textarea
                    rows={3}
                    value={form.seo_description ?? ""}
                    onChange={(e) => set({ seo_description: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
