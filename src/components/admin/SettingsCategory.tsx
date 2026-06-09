import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Save, Eye, EyeOff } from "lucide-react";
import { listSettings, updateSetting, type AppSetting } from "@/lib/settings";
import { toast } from "sonner";

export function SettingsCategory({ category }: { category: string }) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings", category],
    queryFn: () => listSettings(category),
  });

  if (isLoading) return <p className="text-[var(--text-muted)]">Carregando…</p>;

  const list = settings ?? [];
  if (list.length === 0) {
    return <p className="text-primary-dark/60 text-sm">Nenhuma configuração nesta categoria.</p>;
  }

  return (
    <div className="space-y-5 mt-2">
      {list.map((s) => <SettingField key={s.key} setting={s} />)}
    </div>
  );
}

function SettingField({ setting }: { setting: AppSetting }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(setting.value);
  const [show, setShow] = useState(false);

  useEffect(() => { setValue(setting.value); }, [setting.value]);

  const save = useMutation({
    mutationFn: () => updateSetting(setting.key, value),
    onSuccess: () => {
      toast.success(`${setting.label ?? setting.key} salvo`);
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
    onError: (err: Error) => toast.error(err.message),
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
