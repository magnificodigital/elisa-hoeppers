import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Loader2, 
  Megaphone, 
  Edit, 
  Trash2, 
  Users, 
  ArrowLeft,
  Copy,
  ToggleLeft,
  ToggleRight,
  Gift
} from "lucide-react";
import { toast } from "sonner";
import { listNotices, updateNotice, deleteNotice, type SiteNotice } from "@/lib/notices";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/website/avisos/")({
  head: () => ({ meta: [{ title: "Admin — Gerenciar Avisos" }] }),
  component: () => <NoticesListPage />,
});

function NoticesListPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: notices, isLoading } = useQuery({ 
    queryKey: ["site_notices"], 
    queryFn: listNotices 
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SiteNotice> }) => updateNotice(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_notices"] });
      toast.success("Atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_notices"] });
      toast.success("Aviso excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/admin/website" className="text-primary hover:text-primary-dark transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Avisos</h1>
            </div>
            <p className="text-primary-dark/70">
              Crie popups e lightboxes para promoções e avisos importantes.
            </p>
          </div>
          <Link
            to="/admin/website/avisos/editar/$id"
            params={{ id: "novo" }}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Aviso
          </Link>
        </div>

        <Link
          to="/admin/configuracoes/cupom"
          className="flex items-center gap-4 bg-white rounded-2xl border border-border p-5 mb-6 hover:shadow-lg transition group"
        >
          <div className="w-11 h-11 rounded-full bg-bodyoga-green/10 flex items-center justify-center shrink-0">
            <Gift size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg text-primary-dark group-hover:text-primary transition">Cupom de 1ª compra</h2>
            <p className="text-sm text-primary-dark/60">Edite os textos do popup de captura (título, subtítulo, botão, consentimento) e o % de desconto.</p>
          </div>
          <ArrowLeft className="w-4 h-4 rotate-180 text-primary-dark/40 group-hover:text-primary transition" />
        </Link>

        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-cream/30 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Aviso</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Páginas</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 text-center">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 text-center">Ativo</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notices?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-primary-dark/40">
                      Nenhum aviso criado ainda.
                    </td>
                  </tr>
                ) : (
                  notices?.map((n) => (
                    <tr key={n.id} className="hover:bg-cream/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Megaphone className="w-5 h-5 text-primary/40" />
                          <div>
                            <p className="text-sm font-medium text-primary-dark">{n.title}</p>
                            <p className="text-[10px] text-primary-dark/40 italic">
                              {n.delay_seconds}s delay • {n.frequency}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {n.pages.map(p => (
                            <span key={p} className="px-2 py-0.5 bg-sand rounded text-[10px] text-primary-dark/60">
                              {p === 'all' ? 'Todo o site' : p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {n.capture_lead ? (
                           <div className="flex flex-col items-center">
                             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter bg-blue-100 text-blue-700">
                               Formulário
                             </span>
                             <Link 
                               to="/admin/website/avisos/$id/leads" 
                               params={{ id: n.id }}
                               className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-1"
                             >
                               <Users className="w-3 h-3" /> {n._count?.leads || 0} leads
                             </Link>
                           </div>
                         ) : (
                           <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter bg-gray-100 text-gray-500">
                             Informativo
                           </span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch 
                          checked={n.active} 
                          onCheckedChange={(active) => update.mutate({ id: n.id, patch: { active } })}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Link 
                            to="/admin/website/avisos/editar/$id" 
                            params={{ id: n.id }}
                            className="p-2 text-primary-dark/40 hover:text-primary transition"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => confirm(`Excluir "${n.title}"?`) && del.mutate(n.id)}
                            className="p-2 text-primary-dark/40 hover:text-red-500 transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
