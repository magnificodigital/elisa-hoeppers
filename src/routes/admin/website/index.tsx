import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  Loader2, 
  Plus, 
  Trash2, 
  Star, 
  Layout, 
  Globe, 
  Bell, 
  Menu as MenuIcon,
  Copy,
  LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";
import { createPage, deletePage, listPages, slugify, updatePage, type SitePage } from "@/lib/pages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/website/")({
  head: () => ({ meta: [{ title: "Admin — Gerenciar Site" }] }),
  component: () => <WebsiteAdminPage />,
});

function WebsiteAdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [activeTab, setActiveTab] = useState("pages");

  const { data: allPages, isLoading } = useQuery({ queryKey: ["pages"], queryFn: listPages });

  const create = useMutation({
    mutationFn: async (type: string) => {
      const finalSlug = slugify(slug || title);
      if (!title.trim()) throw new Error("Informe o título");
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

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SitePage> }) => updatePage(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Atualizado");
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

  const setAsHome = async (id: string) => {
    try {
      // The DB unique index handles the rest if we update all to false first, 
      // but easier to just update the target to true and let others fail or be handled by logic.
      // Better: updatePage logic in Supabase migration ensures uniqueness.
      await update.mutateAsync({ id, patch: { is_home: true } });
    } catch (e) {}
  };

  const pages = allPages?.filter(p => p.type === 'site') ?? [];
  const landingPages = allPages?.filter(p => p.type === 'landing') ?? [];

  const inputCls = "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">WebSite</h1>
              <p className="text-primary-dark/70">
                poder editar tudo.
              </p>
            </div>
            <div className="flex gap-2">
               <button
                  onClick={() => create.mutate('site')}
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nova Página
                </button>
            </div>
          </div>

          <Tabs defaultValue="pages" onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/50 border border-border p-1 rounded-xl mb-6">
              <TabsTrigger value="pages" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Globe className="w-4 h-4 mr-2" />
                Páginas do site
              </TabsTrigger>
              <TabsTrigger value="landing" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                
                Landing pages
              </TabsTrigger>
              <TabsTrigger value="blog" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                Blog
              </TabsTrigger>
              <TabsTrigger value="notices" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Bell className="w-4 h-4 mr-2" />
                Avisos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pages">
               <PageTable 
                  pages={pages} 
                  isLoading={isLoading} 
                  onDelete={(id: string) => del.mutate(id)}
                  onSetHome={setAsHome}
                  onToggleMenu={(id: string, in_menu: boolean) => update.mutate({ id, patch: { in_menu } })}
                  onUpdateOrder={(id: string, menu_order: number) => update.mutate({ id, patch: { menu_order } })}
               />
            </TabsContent>

            <TabsContent value="landing">
               <PageTable 
                  pages={landingPages} 
                  isLoading={isLoading} 
                  onDelete={(id: string) => del.mutate(id)}
               />
            </TabsContent>

            <TabsContent value="blog">
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-border">
                
                <h3 className="text-lg font-medium text-primary-dark mb-2">Blog e Posts</h3>
                <p className="text-primary-dark/60 mb-6">Use a seção de Posts para gerenciar o blog.</p>
                <Link to="/admin/blog" className="text-primary hover:underline uppercase text-xs tracking-widest font-bold">
                   Ir para Posts
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="notices">
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-border">
                <Bell className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary-dark mb-2">Avisos do Site</h3>
                <p className="text-primary-dark/60">Em breve: Gerencie banners de aviso e popups.</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 bg-white rounded-2xl border border-border p-6 shadow-sm">
             <h3 className="text-sm font-bold uppercase tracking-widest text-primary-dark/60 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Criação Rápida
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="Título (ex: Quem Somos)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-dark/30 text-sm">/p/</span>
                   <input
                     placeholder="slug"
                     value={slug}
                     onChange={(e) => setSlug(e.target.value)}
                     className={inputCls + " pl-7"}
                   />
                </div>
                <button
                  onClick={() => create.mutate(activeTab === 'landing' ? 'landing' : 'site')}
                  disabled={create.isPending || !title}
                  className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
                >
                  Criar Agora
                </button>
             </div>
          </div>
      </div>
    </div>
  );
}

function PageTable({ pages, isLoading, onDelete, onSetHome, onToggleMenu, onUpdateOrder }: any) {
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (pages.length === 0) return <div className="bg-white rounded-xl p-8 text-center text-primary-dark/50 border border-border">Nenhuma página encontrada.</div>;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-cream/30 border-b border-border">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Título</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 text-center">Início</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 text-center">Menu</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((p: SitePage) => (
              <tr key={p.id} className="hover:bg-cream/10 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary/40" />
                    <div>
                      <p className="text-sm font-medium text-primary-dark">{p.title}</p>
                      <p className="text-xs text-primary-dark/40">/p/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onSetHome?.(p.id)}
                    className={`transition-colors ${p.is_home ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                    title={p.is_home ? "Página Inicial" : "Definir como Inicial"}
                  >
                    <Star className={`w-5 h-5 ${p.is_home ? 'fill-current' : ''}`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  {onToggleMenu && (
                    <div className="flex flex-col items-center gap-1">
                      <Switch 
                        checked={p.in_menu} 
                        onCheckedChange={(val) => onToggleMenu(p.id, val)}
                      />
                      {p.in_menu && (
                        <input 
                           type="number" 
                           className="w-12 text-[10px] border border-border rounded text-center"
                           value={p.menu_order ?? 0}
                           onChange={(e) => onUpdateOrder(p.id, parseInt(e.target.value) || 0)}
                        />
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                    p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.status === 'active' ? 'Ativa' : 'Rascunho'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Link 
                      to="/admin/site/paginas/$id" 
                      params={{ id: p.id }}
                      className="p-2 text-primary-dark/40 hover:text-primary transition"
                      title="Editar"
                    >
                      <Plus className="w-4 h-4" />
                    </Link>
                    <a 
                      href={`/p/${p.slug}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2 text-primary-dark/40 hover:text-primary transition"
                      title="Ver"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => confirm(`Excluir "${p.title}"?`) && onDelete(p.id)}
                      className="p-2 text-primary-dark/40 hover:text-red-500 transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
