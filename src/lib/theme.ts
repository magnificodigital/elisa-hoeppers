import { supabase } from "./supabase";

/** Chaves de cor editáveis no admin e as variáveis CSS que cada uma controla. */
export const THEME_VARS: Record<string, { label: string; fallback: string; vars: string[] }> = {
  theme_primary: {
    label: "Verde (marca)",
    fallback: "#3B4F30",
    vars: [
      "--primary",
      "--primary-dark",
      "--bodyoga-green",
      "--bodyoga-brown",
      "--accent-blue",
      "--accent-teal",
      "--foreground",
      "--ring",
    ],
  },
  theme_cream: {
    label: "Creme (fundo)",
    fallback: "#F7F0E5",
    vars: ["--cream", "--cream-rose", "--bodyoga-cream", "--background", "--card"],
  },
};


export const THEME_KEYS = Object.keys(THEME_VARS);

export type ThemeColors = Record<string, string>;

export function defaultTheme(): ThemeColors {
  return Object.fromEntries(Object.entries(THEME_VARS).map(([k, v]) => [k, v.fallback]));
}

/** Lê as cores públicas (sem exigir login). */
export async function fetchTheme(): Promise<ThemeColors> {
  const entries = await Promise.all(
    THEME_KEYS.map(async (key) => {
      try {
        const { data } = await supabase.rpc("get_public_setting", { p_key: key });
        const value = typeof data === "string" ? data.trim() : "";
        return [key, value || THEME_VARS[key].fallback] as const;
      } catch {
        return [key, THEME_VARS[key].fallback] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}

export function applyTheme(colors: ThemeColors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [key, cfg] of Object.entries(THEME_VARS)) {
    const value = colors[key];
    if (!value || !/^#[0-9a-fA-F]{3,8}$/.test(value)) continue;
    for (const cssVar of cfg.vars) root.style.setProperty(cssVar, value);
  }
}
