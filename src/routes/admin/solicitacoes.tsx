import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  Briefcase, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Save,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/solicitacoes")({
  head: () => ({ meta: [{ title: "Admin — Solicitações de Projetos" }] }),
  component: () => (
    
      <AdminProjectRequests />
    
  ),
});

const STATUS_OPTIONS = [
  { id: "nova", label: "Novas", color: "bg-blue-500" },
  { id: "em_andamento", label: "Em andamento", color: "bg-yellow-500" },
  { id: "respondida", label: "Respondidas", color: "bg-green-500" },
  { id: "fechada", label: "Fechadas", color: "bg-gray-500" },
];

function AdminProjectRequests() {
  const [filter, setFilter] = useState("nova");
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["project-requests", filter],
    queryFn: async () => {
      let query = supabase
        .from("custom_project_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    
      <section className="py-12 md:py-20 bg-background min-h-screen">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-7 h-7 text-[#3B4F30]" />
            <h1 className="font-display text-3xl md:text-4xl text-[#3B4F30]">Solicitações</h1>
          </div>
          <p className="text-[#3B4F30]/60 mb-8 text-sm">
            Gerencie as solicitações de projetos personalizados e brindes corporativos.
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setFilter("all")}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                filter === "all"
                  ? "bg-[#3B4F30] text-white"
                  : "bg-white text-[#3B4F30] border border-[#3B4F30]/10 hover:border-[#3B4F30]"
              }`}
            >
              Todas
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilter(s.id)}
                className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                  filter === s.id
                    ? "bg-[#3B4F30] text-white"
                    : "bg-white text-[#3B4F30] border border-[#3B4F30]/10 hover:border-[#3B4F30]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-20 opacity-50">Carregando solicitações...</div>
          ) : !requests?.length ? (
            <div className="bg-white/50 border border-[#3B4F30]/5 rounded-3xl p-12 text-center shadow-none">
              <p className="text-[#3B4F30]/60">Nenhuma solicitação encontrada neste filtro.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      </section>
    
  );
}

function RequestCard({ request: req }: { request: any }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(req.admin_notes || "");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from("custom_project_requests")
        .update(updates)
        .eq("id", req.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-requests"] });
      toast.success("Atualizado com sucesso");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handleSaveNotes = () => {
    updateMutation.mutate({ admin_notes: notes });
  };

  const cleanWhatsApp = req.whatsapp.replace(/\D/g, "");
  const whatsappUrl = cleanWhatsApp.length >= 10 
    ? `https://wa.me/${cleanWhatsApp.startsWith("55") ? cleanWhatsApp : "55" + cleanWhatsApp}`
    : "#";

  const statusInfo = STATUS_OPTIONS.find(s => s.id === req.status) || STATUS_OPTIONS[0];

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-border/20 shadow-none transition hover:shadow-md">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider text-white ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#3B4F30]/40 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(req.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <h3 className="font-display text-xl text-[#3B4F30]">{req.name}</h3>
            <p className="text-sm text-[#3B4F30]/60 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {req.company || "Pessoa Física"}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={req.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-bodyoga-cream text-[#3B4F30] text-xs uppercase tracking-wider px-4 py-2 rounded-full border-none focus:ring-1 focus:ring-[#3B4F30]/20 cursor-pointer"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white p-2.5 rounded-full hover:opacity-90 transition shadow-sm"
              title="Chamar no WhatsApp"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2 text-[#3B4F30]/70">
            <Mail className="w-4 h-4 shrink-0" />
            <span className="truncate">{req.email}</span>
          </div>
          <div className="flex items-center gap-2 text-[#3B4F30]/70">
            <Briefcase className="w-4 h-4 shrink-0" />
            <span className="capitalize">{req.project_type === 'fragrancia' ? 'Fragrância' : req.project_type === 'brinde' ? 'Brinde' : 'Outro'}</span>
          </div>
          {req.budget_range && (
            <div className="flex items-center gap-2 text-[#3B4F30]/70">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#3B4F30]/5 px-2 py-0.5 rounded">R$</span>
              <span>{req.budget_range}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[#3B4F30]/40 hover:text-[#3B4F30] transition border-t border-[#3B4F30]/5 mt-2"
        >
          {expanded ? (
            <>Ocultar Detalhes <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Ver Brief Completo <ChevronDown className="w-4 h-4" /></>
          )}
        </button>

        {expanded && (
          <div className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {req.cnpj && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-bold opacity-40 mb-1">CNPJ</h4>
                  <p className="text-[#3B4F30]">{req.cnpj}</p>
                </div>
              )}
              {req.quantity_estimate && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-bold opacity-40 mb-1">Quantidade</h4>
                  <p className="text-[#3B4F30]">{req.quantity_estimate}</p>
                </div>
              )}
              {req.deadline && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-bold opacity-40 mb-1">Prazo Desejado</h4>
                  <p className="text-[#3B4F30]">{req.deadline}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-[10px] uppercase tracking-wider font-bold opacity-40 mb-2">Briefing do Projeto</h4>
              <div className="bg-bodyoga-cream/50 p-5 rounded-2xl text-[#3B4F30] leading-relaxed whitespace-pre-line border border-[#3B4F30]/5">
                {req.brief}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] uppercase tracking-wider font-bold opacity-40 mb-1">Notas Internas</h4>
              <div className="flex gap-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-[#3B4F30]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B4F30]/20 resize-none"
                  placeholder="Adicione anotações sobre o contato, orçamento enviado, etc..."
                  rows={2}
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={updateMutation.isPending || notes === req.admin_notes}
                  className="bg-[#3B4F30] text-white px-4 rounded-2xl hover:opacity-90 transition disabled:opacity-50 shrink-0 self-end py-3"
                  title="Salvar Notas"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
