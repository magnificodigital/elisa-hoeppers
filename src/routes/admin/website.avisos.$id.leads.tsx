import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Download, MessageCircle, Mail, User } from "lucide-react";
import { listNoticeLeads, getNotice } from "@/lib/notices";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/website/avisos/$id/leads")({
  head: () => ({ meta: [{ title: "Admin — Leads do Aviso" }] }),
  component: () => <NoticeLeadsPage />,
});

function NoticeLeadsPage() {
  const { id } = useParams({ from: "/admin/website/avisos/$id/leads" });

  const { data: notice } = useQuery({
    queryKey: ["site_notice", id],
    queryFn: () => getNotice(id)
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["notice_leads", id],
    queryFn: () => listNoticeLeads(id)
  });

  const exportCSV = () => {
    if (!leads || leads.length === 0) return;
    
    const headers = ["Nome", "Email", "Telefone", "Página", "Data"];
    const rows = leads.map(l => [
      l.name || "",
      l.email || "",
      l.phone || "",
      l.page || "",
      new Date(l.created_at).toLocaleString('pt-BR')
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads-${notice?.title || 'aviso'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/admin/website/avisos" className="text-primary hover:text-primary-dark transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-display text-3xl md:text-4xl text-primary-dark">
                Leads: <span className="text-primary-dark/60">{notice?.title}</span>
              </h1>
            </div>
            <p className="text-primary-dark/70">
              Total de {leads?.length || 0} leads capturados através deste aviso.
            </p>
          </div>
          
          <Button 
            onClick={exportCSV}
            disabled={!leads || leads.length === 0}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-cream/30 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Contato</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Email</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Telefone</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Página</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60">Data</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-primary-dark/60 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-primary-dark/40">
                      Nenhum lead capturado ainda.
                    </td>
                  </tr>
                ) : (
                  leads?.map((l) => (
                    <tr key={l.id} className="hover:bg-cream/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-primary/40" />
                          <span className="text-sm font-medium text-primary-dark">{l.name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-primary/40" />
                          <span className="text-sm text-primary-dark/70">{l.email || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary-dark/70">{l.phone || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-primary-dark/40 italic">{l.page || "/"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-primary-dark/60">
                          {new Date(l.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {l.phone && (
                          <a 
                            href={`https://wa.me/55${l.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-green-600 hover:text-green-700 transition font-bold"
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
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
