import { useEffect, useState } from "react";
import { getSetting, updateSetting } from "./settings";

export type NavPosition = "off" | "left" | "right";

// Pages that can be linked from a menu item. hrefs must be real app routes
// so TanStack <Link to> stays type-safe.
export const PAGE_OPTIONS = [
  { label: "Início", href: "/" },
  { label: "Sobre", href: "/sobre" },
  { label: "BODYOGA", href: "/bodyoga" },
  { label: "Shop / Loja", href: "/loja" },
  { label: "Aulas / Cursos", href: "/cursos" },
  { label: "Dicas / Blog", href: "/blog" },
  { label: "Agende sua aula", href: "/agende-sua-aula" },
  { label: "Cadastro de alunos", href: "/cadastro-de-alunos" },
  { label: "Bio", href: "/bio" },
  { label: "Perfumista", href: "/perfumista" },
  { label: "Privacidade", href: "/privacidade" },
  { label: "Termos", href: "/termos" },
  { label: "Sob Medida", href: "/projetos-personalizados" },
] as const;

export type NavHref = (typeof PAGE_OPTIONS)[number]["href"];

export type NavItem = {
  id: string;
  label: string;
  href: NavHref;
  header: NavPosition;
  footer: NavPosition;
};

export type NavMenuConfig = { items: NavItem[] };

const VALID_HREFS = PAGE_OPTIONS.map((p) => p.href) as readonly string[];
const POSITIONS: NavPosition[] = ["off", "left", "right"];

export const DEFAULT_NAV_CONFIG: NavMenuConfig = {
  items: [
    { id: "sobre", label: "SOBRE", href: "/sobre", header: "left", footer: "left" },
    { id: "bodyoga", label: "BODYOGA", href: "/bodyoga", header: "left", footer: "off" },
    { id: "projetos", label: "SOB MEDIDA", href: "/projetos-personalizados", header: "left", footer: "off" },
    { id: "loja", label: "SHOP", href: "/loja", header: "left", footer: "right" },
    { id: "cursos", label: "AULAS", href: "/cursos", header: "right", footer: "left" },
    { id: "blog", label: "DICAS", href: "/blog", header: "right", footer: "right" },
    { id: "agende", label: "AGENDE SUA AULA", href: "/agende-sua-aula", header: "off", footer: "left" },
  ],
};

export function newNavItem(): NavItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: "Nova página",
    href: "/",
    header: "off",
    footer: "off",
  };
}

function normalize(raw: unknown): NavMenuConfig {
  const rawItems =
    raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)
      ? ((raw as { items: unknown[] }).items)
      : null;
  if (!rawItems) return { items: [...DEFAULT_NAV_CONFIG.items] };

  const items: NavItem[] = [];
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const href = VALID_HREFS.includes(e.href as string) ? (e.href as NavHref) : "/";
    items.push({
      id: typeof e.id === "string" ? e.id : newNavItem().id,
      label: typeof e.label === "string" && e.label.trim() ? e.label : "Página",
      href,
      header: POSITIONS.includes(e.header as NavPosition) ? (e.header as NavPosition) : "off",
      footer: POSITIONS.includes(e.footer as NavPosition) ? (e.footer as NavPosition) : "off",
    });
  }
  return { items };
}

export async function getNavConfig(): Promise<NavMenuConfig> {
  try {
    const raw = await getSetting("nav_menu");
    if (!raw) return { items: [...DEFAULT_NAV_CONFIG.items] };
    return normalize(JSON.parse(raw));
  } catch {
    return { items: [...DEFAULT_NAV_CONFIG.items] };
  }
}

export async function saveNavConfig(cfg: NavMenuConfig): Promise<void> {
  await updateSetting("nav_menu", JSON.stringify(cfg));
}

/** Client hook: returns the configured menu (defaults until loaded). */
export function useNavConfig(): NavMenuConfig {
  const [config, setConfig] = useState<NavMenuConfig>(DEFAULT_NAV_CONFIG);
  useEffect(() => {
    let alive = true;
    getNavConfig().then((c) => {
      if (alive) setConfig(c);
    });
    return () => {
      alive = false;
    };
  }, []);
  return config;
}

export function itemsFor(
  config: NavMenuConfig,
  target: "header" | "footer",
  side: "left" | "right",
): NavItem[] {
  return config.items.filter((item) => item[target] === side);
}
