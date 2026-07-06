import { createServerFn } from "@tanstack/react-start";

export type InstagramPost = {
  id: string;
  caption: string;
  permalink: string;
  imageUrl: string;
};

/**
 * Busca os posts mais recentes do Instagram usando o token salvo em app_settings
 * (categoria "integracoes"). Falha silenciosamente (retorna lista vazia) para que
 * a home use as imagens padrão quando não houver token válido.
 */
export const getInstagramPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ enabled: boolean; posts: InstagramPost[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("key, value")
      .in("key", ["ig_enabled", "ig_access_token", "ig_user_id"]);

    if (error) return { enabled: false, posts: [] };

    const map = new Map((data ?? []).map((r) => [r.key, r.value]));
    const enabled = map.get("ig_enabled") === "true";
    const token = (map.get("ig_access_token") ?? "").trim();
    const userId = (map.get("ig_user_id") ?? "").trim();

    if (!enabled || !token || !userId) {
      return { enabled, posts: [] };
    }

    try {
      const fields = "id,caption,media_type,media_url,permalink,thumbnail_url";
      const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
        userId,
      )}/media?fields=${fields}&limit=4&access_token=${encodeURIComponent(token)}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.error("Instagram Graph API error:", res.status, await res.text());
        return { enabled, posts: [] };
      }

      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          caption?: string;
          media_type?: string;
          media_url?: string;
          permalink?: string;
          thumbnail_url?: string;
        }>;
      };

      const posts: InstagramPost[] = (json.data ?? [])
        .map((m) => ({
          id: m.id,
          caption: m.caption ?? "",
          permalink: m.permalink ?? "",
          imageUrl: m.media_type === "VIDEO" ? m.thumbnail_url ?? "" : m.media_url ?? "",
        }))
        .filter((p) => p.imageUrl && p.permalink)
        .slice(0, 4);

      return { enabled, posts };
    } catch (err) {
      console.error("Instagram fetch failed:", err);
      return { enabled, posts: [] };
    }
  },
);
