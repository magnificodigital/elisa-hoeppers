import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import {
  NAV_CATALOG,
  DEFAULT_NAV_CONFIG,
  getNavConfig,
  saveNavConfig,
  type NavMenuConfig,
  type NavPosition,
} from "@/lib/nav-config";

export const Route = createFileRoute("/admin/site/menu")({
  head: () => ({ meta: [{ title: "Admin — Menu" }] }),
  component: () => (
    <AdminGuard>
      <MenuPage />
    </AdminGuard>
  ),
});

const POSITION_LABELS: { value: NavPosition; label: string }[] = [
  { value: "off", label: "Não exibir" },
  { value: "left", label: "Esquerda" },
  { value: "right", label: "Direita" },
];

function PositionSelect({
  value,
  onChange,
}: {
  value: NavPosition;
  onChange: (v: NavPosition) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[#DBCCBF] overflow-hidden">
      {POSITION_LABELS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-[#3B4F30] text-[#DBCCBF]"
              : "bg-white text-[#3B4F30] hover:bg-[#3B4F30]/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MenuPage() {
  const [config, setConfig] = useState<NavMenuConfig>(DEFAULT_NAV_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getNavConfig().then((c) => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  const update = (
    id: keyof NavMenuConfig,
    target: "header" | "footer",
    value: NavPosition,
  ) => {
    setSaved(false);
    setConfig((prev) => ({
      ...prev,
      [id]: { ...prev[id], [target]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveNavConfig(config);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to="/admin/site"
            className="inline-flex items-center gap-1 text-sm text-[#3B4F30]/70 hover:text-[#3B4F30] transition mb-6"
          >
            <ChevronLeft size={16} /> Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-[#3B4F30] mb-1">
            Menu de navegação
          </h1>
          <p className="text-sm text-[#3B4F30]/70 mb-8">
            Escolha quais páginas aparecem no cabeçalho (header) e no rodapé
            (footer), e de que lado.
          </p>

          {loading ? (
            <p className="text-sm text-[#3B4F30]/60">Carregando…</p>
          ) : (
            <div className="space-y-4">
              {NAV_CATALOG.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#DBCCBF]/60 p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-[#3B4F30]">
                        {item.label}
                      </h2>
                      <p className="text-xs text-[#3B4F30]/50">{item.href}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs uppercase tracking-wide text-[#3B4F30]/60 mb-1.5">
                          Header
                        </span>
                        <PositionSelect
                          value={config[item.id].header}
                          onChange={(v) => update(item.id, "header", v)}
                        />
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-wide text-[#3B4F30]/60 mb-1.5">
                          Footer
                        </span>
                        <PositionSelect
                          value={config[item.id].footer}
                          onChange={(v) => update(item.id, "footer", v)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-[#3B4F30] text-[#DBCCBF] px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Salvando…" : "Salvar"}
                </button>
                {saved && (
                  <span className="text-sm text-[#3B4F30]">Salvo!</span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
