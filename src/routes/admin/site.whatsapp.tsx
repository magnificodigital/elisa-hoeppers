import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { listSettings, updateSetting } from "@/lib/settings";

export const Route = createFileRoute("/admin/site/whatsapp")({
  head: () => ({ meta: [{ title: "Admin — Botão do WhatsApp" }] }),
  component: () => (
    <AdminGuard>
      <WhatsAppSettingsPage />
    </AdminGuard>
  ),
});

const KEYS = [
  "whatsapp_enabled",
  "whatsapp_phone",
  "whatsapp_message",
  "whatsapp_tooltip",
  "whatsapp_position",
] as const;

function WhatsAppSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings", "whatsapp"],
    queryFn: () => listSettings("whatsapp"),
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setValues(Object.fromEntries(data.map((s) => [s.key, s.value ?? ""])));
  }, [data]);

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const phone = (values.whatsapp_phone ?? "").replace(/\D/g, "");
    if (values.whatsapp_enabled !== "false" && phone.length < 10) {
      toast.error("Informe um número válido com código do país e DDD");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        KEYS.map((k) => updateSetting(k, k === "whatsapp_phone" ? phone : values[k] ?? ""))
      );
      await qc.invalidateQueries({ queryKey: ["settings", "whatsapp"] });
      await qc.invalidateQueries({ queryKey: ["whatsapp-config"] });
      toast.success("Botão do WhatsApp atualizado");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  const previewPhone = (values.whatsapp_phone ?? "").replace(/\D/g, "");
  const previewLink = `https://wa.me/${previewPhone}${
    values.whatsapp_message ? `?text=${encodeURIComponent(values.whatsapp_message)}` : ""
  }`;

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to="/admin/site"
            className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition mb-5"
          >
            <ArrowLeft size={16} /> Voltar para Site
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Botão do WhatsApp</h1>
          <p className="text-primary-dark/70 mb-8">
            Controle o botão verde flutuante que aparece em todas as páginas do site.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white rounded-xl p-5 md:p-6 space-y-5 shadow-none border border-border/20">
              <label className="flex items-center gap-2 text-sm text-primary-dark">
                <input
                  type="checkbox"
                  checked={values.whatsapp_enabled !== "false"}
                  onChange={(e) => set("whatsapp_enabled", e.target.checked ? "true" : "false")}
                />
                Mostrar o botão do WhatsApp no site
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">
                    Número do WhatsApp
                  </label>
                  <input
                    value={values.whatsapp_phone ?? ""}
                    onChange={(e) => set("whatsapp_phone", e.target.value)}
                    placeholder="5511994061178"
                    className={inputCls}
                  />
                  <p className="text-xs text-primary-dark/50 mt-1">
                    Somente números, com código do país (55) e DDD.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">
                    Posição na tela
                  </label>
                  <select
                    value={values.whatsapp_position || "right"}
                    onChange={(e) => set("whatsapp_position", e.target.value)}
                    className={inputCls}
                  >
                    <option value="right">Canto inferior direito</option>
                    <option value="left">Canto inferior esquerdo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">
                  Mensagem inicial
                </label>
                <textarea
                  rows={3}
                  value={values.whatsapp_message ?? ""}
                  onChange={(e) => set("whatsapp_message", e.target.value)}
                  className={inputCls}
                />
                <p className="text-xs text-primary-dark/50 mt-1">
                  Texto já preenchido na conversa quando a pessoa clicar.
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1">
                  Texto ao passar o mouse
                </label>
                <input
                  value={values.whatsapp_tooltip ?? ""}
                  onChange={(e) => set("whatsapp_tooltip", e.target.value)}
                  className={inputCls}
                />
                <p className="text-xs text-primary-dark/50 mt-1">Deixe vazio para não mostrar o balãozinho.</p>
              </div>

              <div className="rounded-lg bg-background p-4">
                <p className="text-[10px] uppercase tracking-widest text-primary-dark mb-2">Prévia do link</p>
                <a
                  href={previewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary break-all underline"
                >
                  {previewLink}
                </a>
              </div>

              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
