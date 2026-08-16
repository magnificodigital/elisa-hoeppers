import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { listAllRitualsForAdmin, updateRitual } from "@/lib/shop";

export const Route = createFileRoute("/admin/website/categorias")({
  head: () => ({ meta: [{ title: "Admin — Categorias" }] }),
  component: () => <CategoriasPage />,
});

type Draft = { title: string; description: string; is_active: boolean };

function CategoriasPage() {
  const qc = useQueryClient();
  const { data: rituals, isLoading } = useQuery({ queryKey: ["rituals-admin"], queryFn: listAllRitualsForAdmin });
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  useEffect(() => {
    if (rituals) {
      const d: Record<string, Draft> = {};
      rituals.forEach((r) => { d[r.id] = { title: r.title, description: r.description ?? "", is_active: r.is_active }; });
      setDrafts(d);
    }
  }, [rituals]);

  const save = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Draft> }) => updateRitual(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rituals-admin"] }); toast.success("Ritual salvo"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setField = (id: string, key: keyof Draft, val: any) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: val } }));

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/admin/website" className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition mb-5">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 className="font-display text-3xl text-primary-dark mb-2">Categorias</h1>
        <p className="text-primary-dark/70 mb-8">Edite os textos das categorias: Corpo, Mente e Ambiente.</p>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {(rituals ?? []).map((r) => {
              const d = drafts[r.id] ?? { title: r.title, description: r.description ?? "", is_active: r.is_active };
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary-dark/40">/{r.slug}</span>
                    <label className="flex items-center gap-2 text-xs text-primary-dark/70 cursor-pointer">
                      <input type="checkbox" checked={d.is_active} onChange={(e) => setField(r.id, "is_active", e.target.checked)} />
                      Ativo
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark/60 font-bold">Título</label>
                    <input value={d.title} onChange={(e) => setField(r.id, "title", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-primary-dark/60 font-bold">Descrição</label>
                    <textarea value={d.description} onChange={(e) => setField(r.id, "description", e.target.value)} rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <button
                    onClick={() => save.mutate({ id: r.id, patch: { title: d.title, description: d.description, is_active: d.is_active } })}
                    disabled={save.isPending}
                    className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
