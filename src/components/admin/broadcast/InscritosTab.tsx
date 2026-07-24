import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Loader2, Search, Trash2, UserCheck, UserX } from "lucide-react";
import {
  listSubscribers, setSubscribed, deleteSubscriber, exportSubscribersCSV,
} from "@/lib/subscribers";
import { toast } from "sonner";

export function InscritosTab() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "unsub">("active");

  const { data: subs, isLoading } = useQuery({ queryKey: ["subscribers"], queryFn: listSubscribers });

  const toggle = useMutation({
    mutationFn: (args: { id: string; active: boolean }) => setSubscribed(args.id, args.active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteSubscriber(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscribers"] }); toast.success("Inscrito removido"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (subs ?? []).filter((s) => {
      if (filter === "active" && s.unsubscribed_at) return false;
      if (filter === "unsub" && !s.unsubscribed_at) return false;
      if (!q) return true;
      return (
        s.email.toLowerCase().includes(q) ||
        (s.full_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [subs, query, filter]);

  const exportCsv = () => {
    const csv = exportSubscribersCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const inputCls = "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const active = (subs ?? []).filter((s) => !s.unsubscribed_at).length;
  const total = (subs ?? []).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-primary-dark/60">{active} ativos · {total} total</p>
        <button onClick={exportCsv} disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 border border-primary text-primary px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition disabled:opacity-50">
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-dark/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por email ou nome…"
            className={`${inputCls} pl-9`} />
        </div>
        <div className="flex gap-1 bg-white rounded-md p-1 border border-border">
          {(["active", "unsub", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded transition ${filter === f ? "bg-primary text-white" : "text-primary-dark/60 hover:text-primary"}`}>
              {f === "active" ? "Ativos" : f === "unsub" ? "Desinscritos" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-primary-dark/50 py-8 text-center bg-white rounded-lg">Nenhum inscrito encontrado.</p>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream text-[10px] uppercase tracking-widest text-primary-dark/60">
                <th className="text-left px-4 py-2.5">Email</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Nome</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Origem</th>
                <th className="text-left px-4 py-2.5 hidden lg:table-cell">Data</th>
                <th className="text-right px-4 py-2.5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border/50">
                  <td className="px-4 py-2.5 text-primary-dark truncate max-w-[240px]">
                    {s.email}
                    {s.unsubscribed_at && <span className="ml-2 text-[10px] uppercase text-red-600">desinscrito</span>}
                  </td>
                  <td className="px-4 py-2.5 text-primary-dark/70 hidden md:table-cell">{s.full_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-primary-dark/50 hidden md:table-cell">{s.source ?? "—"}</td>
                  <td className="px-4 py-2.5 text-primary-dark/50 hidden lg:table-cell">{new Date(s.subscribed_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => toggle.mutate({ id: s.id, active: !!s.unsubscribed_at })}
                        className="text-primary-dark/60 hover:text-primary transition"
                        aria-label={s.unsubscribed_at ? "Reativar" : "Desinscrever"}
                        title={s.unsubscribed_at ? "Reativar" : "Desinscrever"}
                      >
                        {s.unsubscribed_at ? <UserCheck size={16} /> : <UserX size={16} />}
                      </button>
                      <button
                        onClick={() => { if (confirm(`Excluir ${s.email}?`)) del.mutate(s.id); }}
                        className="text-primary-dark/40 hover:text-red-600 transition"
                        aria-label="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
