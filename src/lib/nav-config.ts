import { useEffect, useState } from "react";
import { getSetting, updateSetting } from "./settings";

export type NavPosition = "off" | "left" | "right";

// Catalog of pages that can be placed in the header/footer menus.
// hrefs must be valid app routes so TanStack <Link to> stays type-safe.
export const NAV_CATALOG = [
  { id: "sobre", label: "SOBRE", href: "/sobre" },
  { id: "bodyoga", label: "BODYOGA", href: "/bodyoga" },
  { id: "loja", label: "SHOP", href: "/loja" },
  { id: "cursos", label: "AULAS", href: "/cursos" },
  { id: "blog", label: "DICAS", href: "/blog" },
  { id: "agende", label: "AGENDE SUA AULA", href: "/agende-sua-aula" },
] as const;

export type NavCatalogItem = (typeof NAV_CATALOG)[number];
export type NavCatalogId = NavCatalogItem["id"];

export type NavItemConfig = { header: NavPosition; footer: NavPosition };
export type NavMenuConfig = Record<NavCatalogId, NavItemConfig>;

export const DEFAULT_NAV_CONFIG: NavMenuConfig = {
  sobre: { header: "left", footer: "left" },
  bodyoga: { header: "left", footer: "off" },
  loja: { header: "left", footer: "right" },
  cursos: { header: "right", footer: "left" },
  blog: { header: "right", footer: "right" },
  agende: { header: "off", footer: "left" },
};

const POSITIONS: NavPosition[] = ["off", "left", "right"];

function normalize(raw: unknown): NavMenuConfig {
  const cfg: NavMenuConfig = { ...DEFAULT_NAV_CONFIG };
  if (raw && typeof raw === "object") {
    for (const item of NAV_CATALOG) {
      const entry = (raw as Record<string, unknown>)[item.id];
      if (entry && typeof entry === "object") {
        const e = entry as Record<string, unknown>;
        const header = POSITIONS.includes(e.header as NavPosition)
          ? (e.header as NavPosition)
          : DEFAULT_NAV_CONFIG[item.id].header;
        const footer = POSITIONS.includes(e.footer as NavPosition)
          ? (e.footer as NavPosition)
          : DEFAULT_NAV_CONFIG[item.id].footer;
        cfg[item.id] = { header, footer };
      }
    }
  }
  return cfg;
}

export async function getNavConfig(): Promise<NavMenuConfig> {
  try {
    const raw = await getSetting("nav_menu");
    if (!raw) return { ...DEFAULT_NAV_CONFIG };
    return normalize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_NAV_CONFIG };
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
): NavCatalogItem[] {
  return NAV_CATALOG.filter((item) => config[item.id][target] === side);
}
