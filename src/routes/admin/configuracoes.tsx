import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Save, Eye, EyeOff, CreditCard, Mail, Truck, CalendarClock, ChevronRight } from "lucide-react";
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

          <Link
            to="/admin/disponibilidade"
            className="bg-white rounded-xl p-6 mb-6 shadow-sm flex items-center gap-3 hover:shadow-lg transition group"
          >
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
              <CalendarClock size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl text-primary-dark group-hover:text-primary transition">Disponibilidade</h2>
              <p className="text-sm text-primary-dark/60">Horários da semana e períodos bloqueados.</p>
            </div>
            <ChevronRight size={20} className="text-primary-dark/40 shrink-0" />
          </Link>

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

          {byCategory.melhorenvio && (
            <SettingsSection
              title="Melhor Envio"
              icon={<Truck size={20} className="text-primary" />}
              description="Cálculo de frete automático no checkout e geração de etiquetas no admin. Gere o token em melhorenvio.com.br > Permissões de Acesso."
              settings={byCategory.melhorenvio}
              helpLink={{ href: "https://app.melhorenvio.com.br/integracoes/permissoes-de-acesso", label: "Abrir Permissões no Melhor Envio" }}
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

  if (setting.key === "me_allowed_services") {
    return <CarrierSelectorField setting={setting} value={value} setValue={setValue} save={save} saved={saved} />;
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

const ME_CARRIERS: { id: string; name: string; company: string }[] = [
  { id: "1", name: "PAC", company: "Correios" },
  { id: "2", name: "SEDEX", company: "Correios" },
  { id: "3", name: "Package", company: "JadLog" },
  { id: "4", name: "Com", company: "JadLog" },
  { id: "7", name: "Azul Cargo", company: "Azul" },
  { id: "12", name: "Hoje", company: "JadLog" },
  { id: "17", name: "Loggi", company: "Loggi" },
  { id: "31", name: "Mini Envios", company: "Correios" },
];

function CarrierSelectorField({ setting, value, setValue, save, saved }: {
  setting: AppSetting;
  value: string;
  setValue: (v: string) => void;
  save: ReturnType<typeof useMutation<unknown, Error, void>> | any;
  saved: boolean;
}) {
  const selected = useMemo(
    () => new Set(value.split(/[,\s]+/).map((s) => s.trim()).filter((s) => /^\d+$/.test(s))),
    [value],
  );
  const allMode = selected.size === 0;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // mantém a ordem dos IDs conhecidos
    const ordered = ME_CARRIERS.filter((c) => next.has(c.id)).map((c) => c.id);
    setValue(ordered.join(","));
  };

  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-2">
        {setting.label ?? setting.key}
      </label>

      <button
        type="button"
        onClick={() => setValue("")}
        className={`w-full text-left rounded-md border px-3 py-2.5 mb-2 transition ${
          allMode ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"
        }`}
      >
        <span className="text-sm font-medium text-primary-dark">Mostrar todas as transportadoras</span>
        <span className="block text-xs text-primary-dark/60">Comportamento padrão — exibe tudo que o Melhor Envio retornar.</span>
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ME_CARRIERS.map((c) => {
          const checked = selected.has(c.id);
          return (
            <label
              key={c.id}
              className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 cursor-pointer transition ${
                checked ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(c.id)}
                className="h-4 w-4 accent-[var(--color-primary,#000)]"
              />
              <span className="min-w-0">
                <span className="block text-sm text-primary-dark leading-tight">{c.name}</span>
                <span className="block text-[11px] text-primary-dark/60 leading-tight">{c.company} · ID {c.id}</span>
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-xs text-primary-dark/60 mt-2">
        {allMode
          ? "Nenhuma selecionada = todas as transportadoras aparecem no checkout."
          : `${selected.size} transportadora(s) selecionada(s) — só essas aparecem no checkout.`}
      </p>

      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending || value === setting.value}
          className="bg-primary text-white px-4 py-2 rounded-md text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60 inline-flex items-center gap-1.5"
        >
          <Save size={14} /> {save.isPending ? "..." : "Salvar"}
        </button>
        {saved && <span className="text-xs text-primary">✓ Salvo</span>}
        {save.error && <span className="text-xs text-red-700">{(save.error as Error).message}</span>}
      </div>
    </div>
  );
}
