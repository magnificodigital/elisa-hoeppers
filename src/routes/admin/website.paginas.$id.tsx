import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, ExternalLink, Loader2, Globe, Settings, Eye } from "lucide-react";
import { toast } from "sonner";
import { getPage, updatePage, type SitePage } from "@/lib/pages";
import { PageBuilderUX } from "@/components/admin/PageBuilderUX";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/website/paginas/$id")({
  head: () => ({ meta: [{ title: "Admin — Editar Página" }] }),
  component: () => <EditPageBuilder />,
});

function EditPageBuilder() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", id],
    queryFn: () => getPage(id),
  });

  useEffect(() => {
    if (page?.content_blocks) {
      setBlocks(page.content_blocks);
    }
  }, [page]);

  const save = useMutation({
    mutationFn: (patch: Partial<SitePage>) => updatePage(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page", id] });
      qc.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Página salva com sucesso");
      setHasChanges(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !page) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleBlocksChange = (newBlocks: any[]) => {
    setBlocks(newBlocks);
    setHasChanges(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Top Toolbar */}
        <header className="h-16 border-b border-border bg-white px-6 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/website" 
              className="p-2 hover:bg-gray-100 rounded-lg text-primary-dark/60 transition"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-primary-dark">{page.title}</h1>
              <p className="text-[10px] text-primary-dark/40 uppercase tracking-widest">/{page.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-dark/40">Status:</span>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={page.status === 'active'} 
                  onCheckedChange={(val) => save.mutate({ status: val ? 'active' : 'draft' })}
                  disabled={save.isPending}
                />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${page.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                  {page.status === 'active' ? 'Ativa' : 'Rascunho'}
                </span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-border" />

            <div className="flex items-center gap-2">
              <a
                href={`/${page.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-full transition"
              >
                <Eye size={14} /> Pré-visualizar
              </a>
              <button
                onClick={() => save.mutate({ content_blocks: blocks })}
                disabled={save.isPending || !hasChanges}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition shadow-sm disabled:opacity-50"
              >
                {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </header>

        {/* Builder Area */}
        <main className="flex-1 overflow-hidden p-6">
          <PageBuilderUX 
            blocks={blocks} 
            onChange={handleBlocksChange}
          />
        </main>
      </div>
  );
}
