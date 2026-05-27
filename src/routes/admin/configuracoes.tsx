import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Save, Eye, EyeOff, CreditCard, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { listSettings, updateSetting, type AppSetting } from "@/lib/settings";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Admin — Configurações" }] }),
  component: () => (
    <AdminGuard>
      <SettingsPage />
    </AdminGuard>
  ),
});

function SettingsPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => listSettings(),
  });

  const byCategory = useMemo(() => {
    const out: Record<string, AppSetting[]> = {};
    (settings ?? []).forEach((s) => {
      if (!out[s.category]) out[s.category] = [];
      out[s.category].push(s);
    });
    return out;
  }, [settings]);

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Configurações</h1>
          <p className="text-primary-dark/70 mb-10">Chaves de integrações e configurações do site.</p>

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}

          {byCategory.mercadopago && (
            <SettingsSection
              title="Mercado Pago"
              icon={<CreditCard size={20} className="text-primary" />}
              description="Configure o checkout online pra aceitar cartão, PIX e boleto. As chaves vêm do seu painel MP > Sua aplicação > Credenciais de produção."
              settings={byCategory.mercadopago}
              helpLink={{ href: "https://www.mercadopago.com.br/developers/panel", label: "Abrir painel Mercado Pago" }}
            />
          )}

          {byCategory.newsletter && (
            <SettingsSection
              title="Newsletter"
              icon={<Mail size={20} className="text-primary" />}
              description="Captura email de visitantes pra envio de broadcasts. Crie uma audience no Resend e cole o ID aqui."
              settings={byCategory.newsletter}
              helpLink={{ href: "https://resend.com/audiences", label: "Abrir Audiences no Resend" }}
            />
          )}
        </div>
      </section>
    </Layout>
  );
}

function SettingsSection({ title, icon, description, settings, helpLink }: {
  title: string;
  icon: React.ReactNode;
  description?: string;
  settings: AppSetting[];
  helpLink?: { href: string; label: string };
}) {
  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">{icon}</div>
        <h2 className="font-display text-2xl text-primary-dark">{title}</h2>
      </div>
      {description && <p className="text-sm text-primary-dark/60 mb-3">{description}</p>}
      {helpLink && (
        <a href={helpLink.href} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-block mb-4">
          {helpLink.label} ↗
        </a>
      )}
      <div className="space-y-5 mt-4">
        {settings.map((s) => <SettingField key={s.key} setting={s} />)}
      </div>
    </div>
  );
}

function SettingField({ setting }: { setting: AppSetting }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(setting.value);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setValue(setting.value); }, [setting.value]);

  const save = useMutation({
    mutationFn: () => updateSetting(setting.key, value),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["app-settings"] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (setting.key.endsWith("_enabled")) {
    const isOn = value === "true";
    return (
      <div className="flex items-start justify-between gap-4 py-2 border-t border-border pt-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary-dark">{setting.label ?? setting.key}</p>
          {setting.description && <p className="text-xs text-primary-dark/60 mt-1">{setting.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !isOn ? "true" : "false";
            setValue(next);
            updateSetting(setting.key, next).then(() => qc.invalidateQueries({ queryKey: ["app-settings"] }));
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition flex-shrink-0 ${isOn ? "bg-primary" : "bg-sand"}`}
          aria-label="Toggle"
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isOn ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
    );
  }

  const masked = setting.is_secret && !show;

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">
        {setting.label ?? setting.key}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={masked ? "password" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={setting.is_secret ? "(em branco — clique pra inserir)" : ""}
            className="w-full border border-border rounded-md px-3 py-2.5 pr-10 bg-white text-primary-dark text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {setting.is_secret && (
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary-dark"
              aria-label={show ? "Esconder" : "Mostrar"}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending || value === setting.value}
          className="bg-primary text-white px-4 py-2 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60 inline-flex items-center gap-1.5"
        >
          <Save size={14} /> {save.isPending ? "..." : "Salvar"}
        </button>
      </div>
      {setting.description && <p className="text-xs text-primary-dark/60 mt-1.5">{setting.description}</p>}
      {saved && <p className="text-xs text-primary mt-1.5">✓ Salvo</p>}
      {save.error && <p className="text-xs text-red-700 mt-1.5">{(save.error as Error).message}</p>}
    </div>
  );
}
