import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { listSettings, updateSetting } from "@/lib/settings";
import { THEME_VARS, THEME_KEYS, applyTheme, defaultTheme } from "@/lib/theme";

export const Route = createFileRoute("/admin/site/cores")({
  head: () => ({ meta: [{ title: "Admin — Cores do site" }] }),
  component: () => (
    
      <CoresPage />
    
  ),
});

function CoresPage() {
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

  // Prévia ao vivo enquanto edita
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

  return (
    
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/site" className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition mb-5">
            <ArrowLeft size={16} /> Voltar para Site
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Cores do site</h1>
          <p className="text-primary-dark/70 mb-8">
            As mudanças aparecem imediatamente aqui como prévia. Clique em salvar para aplicar no site inteiro.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 space-y-5 border border-border/20">
              {Object.entries(THEME_VARS).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-4">
                  <input
                    type="color"
                    value={values[key] ?? cfg.fallback}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer bg-white"
                    aria-label={cfg.label}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary-dark font-medium">{cfg.label}</p>
                    <input
                      value={values[key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                      className="mt-1 w-36 border border-border rounded-md px-2 py-1 text-xs font-mono text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    />
                  </div>
                  <button
                    onClick={() => setValues((v) => ({ ...v, [key]: cfg.fallback }))}
                    className="text-xs text-primary-dark/50 hover:text-primary transition inline-flex items-center gap-1"
                  >
                    <RotateCcw size={13} /> Padrão
                  </button>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  onClick={() => setValues(defaultTheme())}
                  className="text-xs uppercase tracking-widest text-primary-dark/60 hover:text-primary transition"
                >
                  Restaurar todas
                </button>
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
      </section>
    
  );
}
