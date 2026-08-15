import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  Loader2, 
  Plus,
  Pencil,
  Trash2,
  Star, 
  Layout, 
  Globe, 
  Bell, 
  Menu as MenuIcon,
  Copy,
  LayoutDashboard,
  Palette,
  MessageCircle,
  Search,
  GalleryHorizontal
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
    mutationFn: async (pageTitle: string) => {
      const t = pageTitle.trim();
      if (!t) throw new Error("Informe o título");
      const finalSlug = slugify(t);
      if (!finalSlug) throw new Error("Endereço inválido");
      return createPage({ title: t, slug: finalSlug });
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["pages"] });
      navigate({ to: "/admin/website/paginas/$id", params: { id: p.id } });
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
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Site</h1>
              <p className="text-primary-dark/70">
                Gerencie o conteúdo visual, cores e páginas institucionais.
              </p>
            </div>
            <div className="flex gap-2">
               <Link
                  to="/admin/website/home"
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Editar Home
                </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            <WebsiteOption 
              to="/admin/website/menu"
              label="Menu"
              description="Header e Footer"
              icon={MenuIcon}
            />
            <WebsiteOption 
              to="/admin/website/cores"
              label="Cores"
              description="Identidade Visual"
              icon={Palette}
            />
            <WebsiteOption 
              to="/admin/website/whatsapp"
              label="Botão WhatsApp"
              description="Configurar Botão"
              icon={MessageCircle}
            />
            <WebsiteOption 
              to="/admin/website/seo"
              label="SEO"
              description="Busca e Social"
              icon={Search}
            />
            <WebsiteOption 
              to="/admin/bodyoga-slides"
              label="Slides"
              description="Banners do Topo"
              icon={GalleryHorizontal}
            />
            <WebsiteOption 
              to="/admin/website/avisos"
              label="Avisos"
              description="Popups e Promoções"
              icon={Bell}
            />
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-primary-dark">Páginas do Site</h2>
            <button
              onClick={() => {
                const name = window.prompt("Nome da nova página (ex: Quem Somos):");
                if (name?.trim()) create.mutate(name.trim());
              }}
              disabled={create.isPending}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition shadow-sm disabled:opacity-60"
            >
              <Plus className="w-4 h-4" /> Criar nova página
            </button>
          </div>
          
          <PageTable 
            pages={pages} 
            isLoading={isLoading} 
            onDelete={(id: string) => del.mutate(id)}
            onSetHome={setAsHome}
            onToggleMenu={(id: string, in_menu: boolean) => update.mutate({ id, patch: { in_menu } })}
            onUpdateOrder={(id: string, menu_order: number) => update.mutate({ id, patch: { menu_order } })}
          />

      </div>
    </div>
  );
}

function WebsiteOption({ to, label, description, icon: Icon }: any) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl p-5 border border-border/20 shadow-none hover:shadow-lg transition flex items-start gap-4 group"
    >
      <div className="w-11 h-11 rounded-full bg-bodyoga-green/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" />
      </div>
      <div>
        <h3 className="font-display text-lg text-primary-dark mb-1 group-hover:text-primary transition">
          {label}
        </h3>
        <p className="text-sm text-primary-dark/60">{description}</p>
      </div>
    </Link>
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
                      <p className="text-xs text-primary-dark/40">/{p.slug}</p>
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
                    <a
                      href={`/admin/website/paginas/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition"
                      title="Editar página"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </a>
                    <a 
                      href={`/${p.slug}`}
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
