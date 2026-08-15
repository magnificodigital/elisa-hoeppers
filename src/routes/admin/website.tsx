import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  LayoutDashboard,
  Palette,
  MessageSquare,
  Search,
  Settings,
  RotateCcw,
  Save
} from "lucide-react";
import { toast } from "sonner";
import BaseLayout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { createPage, deletePage, listPages, slugify, updatePage, type SitePage } from "@/lib/pages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { listSettings, updateSetting, bulkUpdateSettings } from "@/lib/settings";
import { THEME_VARS, THEME_KEYS, applyTheme, defaultTheme } from "@/lib/theme";
import { 
  PAGE_OPTIONS, 
  getNavConfig, 
  saveNavConfig, 
  newNavItem, 
  type NavItem, 
  type NavHref,
  type NavPosition
} from "@/lib/nav-config";
import { SettingsCategory } from "@/components/admin/SettingsCategory";
import { SlidesList } from "./bodyoga-slides/index.tsx";


export const Route = createFileRoute("/admin/website")({
  head: () => ({ meta: [{ title: "Admin — Gerenciar Site" }] }),
  component: () => (
    <AdminGuard>
      <WebsiteAdminPage />
    </AdminGuard>
  ),
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
    <BaseLayout>
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">WebSite</h1>
              <p className="text-primary-dark/70">
                poder editar tudo.
              </p>
            </div>
            <div className="flex gap-2">
            </div>

          </div>

          <Tabs defaultValue="pages" onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/50 border border-border p-1 rounded-xl mb-6 flex flex-wrap h-auto">
              <TabsTrigger value="pages" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Globe className="w-4 h-4 mr-2" />
                Páginas
              </TabsTrigger>
              <TabsTrigger value="slides" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Layout className="w-4 h-4 mr-2" />
                Slides
              </TabsTrigger>
              <TabsTrigger value="colors" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Palette className="w-4 h-4 mr-2" />
                Cores
              </TabsTrigger>
              <TabsTrigger value="menu" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MenuIcon className="w-4 h-4 mr-2" />
                Menu
              </TabsTrigger>
              <TabsTrigger value="seo" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Search className="w-4 h-4 mr-2" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="notices" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Bell className="w-4 h-4 mr-2" />
                Avisos
              </TabsTrigger>
            </TabsList>


            <TabsContent value="pages">
              <div className="flex justify-end mb-4">
                 <button
                    onClick={() => create.mutate('site')}
                    className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Página
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
            </TabsContent>


            <TabsContent value="slides">
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <SlidesList standalone={false} />
              </div>
            </TabsContent>

            <TabsContent value="colors">
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <CoresTab />
              </div>
            </TabsContent>

            <TabsContent value="menu">
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <MenuTab />
              </div>
            </TabsContent>

            <TabsContent value="seo">
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <SEOTab />
              </div>
            </TabsContent>

            <TabsContent value="whatsapp">
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <WhatsAppTab />
              </div>
            </TabsContent>

            <TabsContent value="notices">
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <AvisosTab />
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
      </section>
    </BaseLayout>
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

function CoresTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings", "aparencia"], queryFn: () => listSettings("aparencia") });
  const [values, setValues] = useState<Record<string, string>>(defaultTheme());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const next = { ...defaultTheme() };
    for (const s of data) if (s.value) next[s.key] = s.value;
    setValues(next);
  }, [data]);

  useEffect(() => {
    applyTheme(values);
  }, [values]);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(THEME_KEYS.map((k) => updateSetting(k, values[k])));
      await qc.invalidateQueries({ queryKey: ["settings", "aparencia"] });
      await qc.invalidateQueries({ queryKey: ["site-theme"] });
      toast.success("Cores salvas");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-2xl text-primary-dark">Cores do site</h2>
        <button onClick={save} disabled={saving} className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar Cores
        </button>
      </div>
      <p className="text-sm text-primary-dark/60 mb-6">As mudanças aparecem imediatamente aqui como prévia.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(THEME_VARS).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-4 p-3 border border-border/50 rounded-xl bg-cream/5">
            <input
              type="color"
              value={values[key] ?? cfg.fallback}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-white"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-dark/60 mb-1">{cfg.label}</p>
              <div className="flex items-center gap-2">
                <input
                  value={values[key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  className="w-24 border border-border rounded px-2 py-0.5 text-[10px] font-mono"
                />
                <button
                  onClick={() => setValues((v) => ({ ...v, [key]: cfg.fallback }))}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={10} /> Padrão
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuTab() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNavConfig().then((c) => {
      setItems(c.items);
      setLoading(false);
    });
  }, []);

  const patch = (id: string, changes: Partial<NavItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, newNavItem()]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveNavConfig({ items });
      toast.success("Menu salvo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-primary-dark">Menu de navegação</h2>
        <button onClick={handleSave} disabled={saving} className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition flex items-center gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar Menu
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="p-4 border border-border rounded-xl bg-cream/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-1 block">Nome</label>
                <input
                  value={item.label}
                  onChange={(e) => patch(item.id, { label: e.target.value })}
                  className="w-full border border-border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-1 block">Destino</label>
                <select
                  value={item.href}
                  onChange={(e) => patch(item.id, { href: e.target.value as NavHref })}
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-white"
                >
                  {PAGE_OPTIONS.map((p) => (
                    <option key={p.href} value={p.href}>{p.label} ({p.href})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end justify-end">
                <button onClick={() => removeItem(item.id)} className="text-red-500 text-xs flex items-center gap-1 hover:underline">
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-2 block">Header</span>
                <div className="flex border border-border rounded overflow-hidden">
                  {(['off', 'left', 'right'] as NavPosition[]).map(pos => (
                    <button
                      key={pos}
                      onClick={() => patch(item.id, { header: pos })}
                      className={`px-3 py-1 text-[10px] uppercase font-bold ${item.header === pos ? 'bg-primary text-white' : 'bg-white text-primary-dark'}`}
                    >
                      {pos === 'off' ? 'Off' : pos === 'left' ? 'Esq' : 'Dir'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-2 block">Footer</span>
                <div className="flex border border-border rounded overflow-hidden">
                  {(['off', 'left', 'right'] as NavPosition[]).map(pos => (
                    <button
                      key={pos}
                      onClick={() => patch(item.id, { footer: pos })}
                      className={`px-3 py-1 text-[10px] uppercase font-bold ${item.footer === pos ? 'bg-primary text-white' : 'bg-white text-primary-dark'}`}
                    >
                      {pos === 'off' ? 'Off' : pos === 'left' ? 'Esq' : 'Dir'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full py-3 border border-dashed border-primary/30 rounded-xl text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/5">
          <Plus size={16} /> Adicionar Item ao Menu
        </button>
      </div>
    </div>
  );
}

function SEOTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="font-display text-2xl text-primary-dark">SEO Global</h2>
      </div>
      <p className="text-sm text-primary-dark/60">Configurações globais de SEO para o site inteiro.</p>
      
      <div className="bg-cream/5 rounded-xl border border-border p-6">
        <SettingsCategory category="seo" />
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <h3 className="font-display text-xl text-primary-dark mb-4">Ferramentas de Indexação</h3>
        <ul className="space-y-3">
           {[
             { label: "Sitemap.xml", href: "/sitemap.xml" },
             { label: "Robots.txt", href: "/robots.txt" },
             { label: "Google Search Console", href: "https://search.google.com/search-console" },
             { label: "Facebook Debugger", href: "https://developers.facebook.com/tools/debug/" }
           ].map(tool => (
             <li key={tool.label}>
               <a href={tool.href} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                 <ExternalLink size={14} /> {tool.label}
               </a>
             </li>
           ))}
        </ul>
      </div>
    </div>
  );
}

function WhatsAppTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings", "whatsapp"], queryFn: () => listSettings("whatsapp") });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setValues(Object.fromEntries(data.map((s) => [s.key, s.value ?? ""])));
  }, [data]);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const phone = (values.whatsapp_phone ?? "").replace(/\D/g, "");
    setSaving(true);
    try {
      await bulkUpdateSettings([
        { key: "whatsapp_enabled", value: values.whatsapp_enabled || "true" },
        { key: "whatsapp_phone", value: phone },
        { key: "whatsapp_message", value: values.whatsapp_message || "" },
        { key: "whatsapp_tooltip", value: values.whatsapp_tooltip || "" },
        { key: "whatsapp_position", value: values.whatsapp_position || "right" },
      ]);
      await qc.invalidateQueries({ queryKey: ["settings", "whatsapp"] });
      await qc.invalidateQueries({ queryKey: ["whatsapp-config"] });
      toast.success("WhatsApp atualizado");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-primary-dark">Botão do WhatsApp</h2>
        <button onClick={save} disabled={saving} className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition flex items-center gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar Configurações
        </button>
      </div>

      <div className="bg-cream/5 rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Switch 
            checked={values.whatsapp_enabled !== "false"} 
            onCheckedChange={(val) => set("whatsapp_enabled", val ? "true" : "false")}
          />
          <span className="text-sm font-medium">Habilitar botão flutuante no site</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-2 block">Número (com DDD)</label>
            <input
              value={values.whatsapp_phone ?? ""}
              onChange={(e) => set("whatsapp_phone", e.target.value)}
              placeholder="5511999999999"
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-2 block">Posição</label>
            <select
              value={values.whatsapp_position || "right"}
              onChange={(e) => set("whatsapp_position", e.target.value)}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="right">Direita</option>
              <option value="left">Esquerda</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-2 block">Mensagem Inicial</label>
          <textarea
            value={values.whatsapp_message ?? ""}
            onChange={(e) => set("whatsapp_message", e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-2 block">Texto do Balão (Tooltip)</label>
          <input
            value={values.whatsapp_tooltip ?? ""}
            onChange={(e) => set("whatsapp_tooltip", e.target.value)}
            className="w-full border border-border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function AvisosTab() {
  const qc = useQueryClient();
  const { data: logoSetting, isLoading: loadingLogo } = useQuery({ 
    queryKey: ["setting", "logo_filter"], 
    queryFn: () => listSettings("branding").then(s => s.find(x => x.key === "logo_filter"))
  });
  const [logoFilter, setLogoFilter] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (logoSetting) setLogoFilter(logoSetting.value || "");
  }, [logoSetting]);

  const save = async () => {
    setSaving(true);
    try {
      await updateSetting("logo_filter", logoFilter);
      await qc.invalidateQueries({ queryKey: ["setting", "logo_filter"] });
      toast.success("Branding atualizado");
    } finally {
      setSaving(false);
    }
  };

  if (loadingLogo) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-primary-dark">Avisos e Branding</h2>
        <button onClick={save} disabled={saving} className="bg-primary text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition flex items-center gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar
        </button>
      </div>

      <div className="bg-cream/5 rounded-xl border border-border p-6 space-y-6">
        <div>
          <label className="text-[10px] uppercase font-bold tracking-widest text-primary-dark/60 mb-2 block">CSS Filter do Logo (Header/Footer)</label>
          <input
            value={logoFilter}
            onChange={(e) => setLogoFilter(e.target.value)}
            placeholder="ex: brightness(0) invert(1)"
            className="w-full border border-border rounded px-3 py-2 text-sm font-mono"
          />
          <p className="mt-2 text-[10px] text-primary-dark/40">
            Use este campo para ajustar a cor do logo SVG/PNG via filtro CSS.
            Padrão Creme: brightness(0) saturate(100%) invert(89%) sepia(8%) saturate(458%) hue-rotate(345deg) brightness(94%) contrast(88%)
          </p>
        </div>
      </div>
    </div>
  );
}


