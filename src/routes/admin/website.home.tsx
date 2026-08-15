import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ImageUploader";
import { listSettings, updateSetting } from "@/lib/settings";

export const Route = createFileRoute("/admin/website/home")({
  head: () => ({ meta: [{ title: "Admin — Conteúdo da Home" }] }),
  component: () => (
    
      <HomeContentPage />
    
  ),
});

const FIELDS: { key: string; label: string; hint?: string; type: "textarea" | "text" | "image" }[] = [
  {
    key: "home_intro_title",
    label: "Título",
    hint: "Use Enter para quebrar linhas e *asteriscos* para deixar um trecho em itálico.",
    type: "textarea",
  },
  { key: "home_intro_p1", label: "Parágrafo 1 (destaque)", type: "textarea" },
  { key: "home_intro_p2", label: "Parágrafo 2 (apoio)", type: "textarea" },
  { key: "home_intro_cta_label", label: "Texto do botão", hint: "Deixe vazio para esconder o botão.", type: "text" },
  { key: "home_intro_cta_href", label: "Link do botão", hint: "Ex.: /sobre", type: "text" },
  { key: "home_intro_image", label: "Imagem da seção", type: "image" },
];

function HomeContentPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings", "home"], queryFn: () => listSettings("home") });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setValues(Object.fromEntries(data.map((s) => [s.key, s.value ?? ""])));
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(FIELDS.map((f) => updateSetting(f.key, values[f.key] ?? "")));
      await qc.invalidateQueries({ queryKey: ["settings", "home"] });
      await qc.invalidateQueries({ queryKey: ["home-intro"] });
      toast.success("Conteúdo salvo");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    
      <div className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/site" className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition mb-5">
            <ArrowLeft size={16} /> Voltar para Site
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Conteúdo da Home</h1>
          <p className="text-primary-dark/70 mb-8">
            Seção de apresentação que aparece entre os produtos e o blog.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 space-y-5 shadow-none border border-border/20">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">{f.label}</label>
                  {f.type === "image" ? (
                    <ImageUploader
                      value={values[f.key] || null}
                      onChange={(url) => setValues((v) => ({ ...v, [f.key]: url ?? "" }))}
                      folder="home"
                      aspectRatio="4/5"
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={f.key === "home_intro_title" ? 3 : 3}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className={inputCls}
                    />
                  ) : (
                    <input
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className={inputCls}
                    />
                  )}
                  {f.hint && <p className="text-xs text-primary-dark/50 mt-1">{f.hint}</p>}
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    
  );
}
