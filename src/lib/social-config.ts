import { useEffect, useState } from "react";
import { getSetting, updateSetting } from "./settings";

export type SocialLinks = {
  instagram: string;
  whatsapp: string;
  youtube: string;
  facebook: string;
};

/** Defaults = links que já estavam no rodapé (nada some antes de configurar). */
export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  instagram: "https://www.instagram.com/bodyoga.oficial/",
  whatsapp: "https://wa.me/5511994061178",
  youtube: "https://www.youtube.com/@ElisaHoeppers",
  facebook: "",
};

export const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/suaconta" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/5511999999999" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@seucanal" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/suapagina" },
];

function normalize(raw: unknown): SocialLinks {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (k: keyof SocialLinks) =>
    typeof r[k] === "string" ? (r[k] as string) : DEFAULT_SOCIAL_LINKS[k];
  return {
    instagram: pick("instagram"),
    whatsapp: pick("whatsapp"),
    youtube: pick("youtube"),
    facebook: pick("facebook"),
  };
}

export async function getSocialLinks(): Promise<SocialLinks> {
  try {
    const raw = await getSetting("social_links");
    if (!raw) return { ...DEFAULT_SOCIAL_LINKS };
    return normalize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SOCIAL_LINKS };
  }
}

export async function saveSocialLinks(value: SocialLinks): Promise<void> {
  await updateSetting("social_links", JSON.stringify(value));
}

export function useSocialLinks(): SocialLinks {
  const [links, setLinks] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS);
  useEffect(() => {
    let alive = true;
    getSocialLinks().then((l) => {
      if (alive) setLinks(l);
    });
    return () => {
      alive = false;
    };
  }, []);
  return links;
}
