import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Save, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPages } from "@/lib/pages";
import {
  PAGE_OPTIONS,
  DEFAULT_NAV_CONFIG,
  getNavConfig,
  saveNavConfig,
  newNavItem,
  type NavMenuConfig,
  type NavItem,
  type NavPosition,
  type NavHref,
} from "@/lib/nav-config";

export const Route = createFileRoute("/admin/website/menu")({
  head: () => ({ meta: [{ title: "Admin — Menu" }] }),
  component: () => (
    
      <MenuPage />
    
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
              ? "bg-primary text-cream"
              : "bg-white text-primary-dark hover:bg-primary/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function MenuPage() {
  const [items, setItems] = useState<NavItem[]>(DEFAULT_NAV_CONFIG.items);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { data: pages } = useQuery({ queryKey: ["pages"], queryFn: listPages });
  const linkOptions = [
    { label: "Início", href: "/" },
    { label: "Shop / Loja", href: "/loja" },
    { label: "Aulas / Cursos", href: "/cursos" },
    { label: "Dicas / Blog", href: "/blog" },
    ...(pages ?? []).map((p) => ({ label: p.title, href: `/${p.slug}` })),
  ];

  useEffect(() => {
    getNavConfig().then((c) => {
      setItems(c.items);
      setLoading(false);
    });
  }, []);

  const patch = (id: string, changes: Partial<NavItem>) => {
    setSaved(false);
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  };

  const addItem = () => {
    setSaved(false);
    setItems((prev) => [...prev, newNavItem()]);
  };

  const removeItem = (id: string) => {
    setSaved(false);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cfg: NavMenuConfig = { items };
      await saveNavConfig(cfg);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            to="/admin/website"
            className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6"
          >
            <ChevronLeft size={16} /> Voltar
          </Link>
          <h1 className="font-display text-3xl text-primary-dark mb-2">
            Menu de navegação
          </h1>
          <p className="text-sm text-primary-dark/60 mb-8">
            Adicione itens, escolha a página de cada um e defina de que lado
            aparecem no cabeçalho (header) e no rodapé (footer).
          </p>

          {loading ? (
            <p className="text-sm text-primary-dark/60">Carregando…</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-none border border-border/20 p-5"
                >
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">
                          Nome no menu
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => patch(item.id, { label: e.target.value })}
                          className="w-full rounded-lg border border-[#DBCCBF] px-3 py-2 text-sm text-primary-dark focus:outline-none focus:border-primary"
                          placeholder="Ex: Aulas"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">
                          Página vinculada
                        </label>
                        <select
                          value={item.href}
                          onChange={(e) =>
                            patch(item.id, { href: e.target.value as NavHref })
                          }
                          className="w-full rounded-lg border border-[#DBCCBF] px-3 py-2 text-sm text-primary-dark bg-white focus:outline-none focus:border-primary"
                        >
                          {item.href && !linkOptions.some((o) => o.href === item.href) && (
                            <option value={item.href}>{item.href} (atual)</option>
                          )}
                          {linkOptions.map((p) => (
                            <option key={p.href} value={p.href}>
                              {p.label} ({p.href})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">
                          Header
                        </span>
                        <PositionSelect
                          value={item.header}
                          onChange={(v) => patch(item.id, { header: v })}
                        />
                      </div>
                      <div>
                        <span className="block text-xs uppercase tracking-wide text-primary-dark/60 mb-1.5">
                          Footer
                        </span>
                        <PositionSelect
                          value={item.footer}
                          onChange={(v) => patch(item.id, { footer: v })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-red-600/80 hover:text-red-600 transition"
                      >
                        <Trash2 size={14} /> Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-primary py-3 text-sm font-medium hover:bg-primary/5 transition"
              >
                <Plus size={16} /> Adicionar item
              </button>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-cream px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Salvando…" : "Salvar"}
                </button>
                {saved && <span className="text-sm text-primary">Salvo!</span>}
              </div>
            </div>
          )}
        </div>
      </section>
    
  );
}
