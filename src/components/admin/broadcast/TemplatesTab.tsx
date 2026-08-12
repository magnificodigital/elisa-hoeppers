import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import {
  listTemplates, createTemplate, updateTemplate, deleteTemplate, type EmailTemplate,
} from "@/lib/email-templates";
import { restoreDefaultTemplates } from "@/lib/email-template-presets";
import { EmailBuilder } from "@/components/admin/EmailBuilder";
import { toast } from "sonner";

export function TemplatesTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: templates, isLoading } = useQuery({ queryKey: ["email-templates"], queryFn: listTemplates });

  const create = useMutation({
    mutationFn: async () => createTemplate({ name: "Novo template" }),
    onSuccess: (t) => { qc.invalidateQueries({ queryKey: ["email-templates"] }); setEditing(t); },
  });

  const restore = useMutation({
    mutationFn: restoreDefaultTemplates,
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success(`${n} templates padrão restaurados em blocos`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); toast.success("Template removido"); },
    onError: (e: Error) => toast.error(e.message),
  });


  if (editing) {
    return (
      <TemplateEditor
        template={editing}
        saving={saving}
        onBack={() => setEditing(null)}
        onSave={async (patch) => {
          setSaving(true);
          try {
            await updateTemplate(editing.id, patch);
            toast.success("Template salvo");
            qc.invalidateQueries({ queryKey: ["email-templates"] });
          } catch (e: any) { toast.error(e.message); }
          finally { setSaving(false); }
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-primary-dark/60">Templates reutilizáveis com editor visual. Use-os ao criar uma campanha.</p>
        <button onClick={() => create.mutate()} disabled={create.isPending}
          className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60">
          {create.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Novo template
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (templates ?? []).length === 0 ? (
        <p className="text-sm text-primary-dark/50 py-8 text-center bg-white rounded-lg">Nenhum template ainda. Crie o primeiro.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(templates ?? []).map((t) => (
            <div key={t.id} className="bg-white rounded-lg p-4 flex items-start justify-between gap-3">
              <button onClick={() => setEditing(t)} className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-dark truncate">{t.name}</p>
                <p className="text-xs text-primary-dark/50 truncate">{t.subject || "(sem assunto)"}</p>
                <p className="text-[10px] text-primary-dark/40 mt-1">Editado em {new Date(t.updated_at).toLocaleString("pt-BR")}</p>
                {t.is_system && <span className="inline-block mt-1 text-[10px] uppercase tracking-widest bg-peach/40 text-primary-dark px-2 py-0.5 rounded-full">Sistema</span>}
              </button>
              {!t.is_system && (
                <button onClick={() => { if (confirm(`Excluir "${t.name}"?`)) del.mutate(t.id); }}
                  className="text-primary-dark/40 hover:text-red-600 transition" aria-label="Excluir">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateEditor({
  template, onBack, onSave, saving,
}: {
  template: EmailTemplate;
  onBack: () => void;
  onSave: (patch: { name: string; subject: string; design_json: any; html: string }) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);

  const inputCls = "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition">
        <ArrowLeft size={16} /> Voltar para templates
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Nome (interno)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">Assunto padrão</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
        </div>
      </div>
      <EmailBuilder
        initialDesign={template.design_json}
        initialHtml={template.html}
        saving={saving}
        onSave={(design, html) => onSave({ name, subject, design_json: design, html })}
      />
    </div>
  );
}
