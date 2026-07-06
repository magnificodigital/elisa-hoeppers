import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { mediaPathFromUrl, mediaUrl } from "@/lib/storage";

// Loja pública (usada nos links do catálogo)
const SITE_URL = "https://elisahoeppers.com.br";

type FeedProduct = {
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  price_cents: number;
  in_stock: boolean;
  brand: string | null;
  gallery: { url: string }[] | null;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function priceBRL(cents: number): string {
  return `${(cents / 100).toFixed(2)} BRL`;
}

function isImage(url: string): boolean {
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(mediaPathFromUrl(url) ?? url);
}

function absoluteUrl(url: string, origin: string): string {
  return url.startsWith("http://") || url.startsWith("https://") ? url : new URL(url, origin).toString();
}

function buildFeed(products: FeedProduct[], origin: string): string {
  const items = products
    .map((p) => {
      const link = `${SITE_URL}/loja/${p.slug}`;
      const imageUrl = (p.gallery ?? []).find((g) => isImage(g.url))?.url ?? "";
      const image = imageUrl ? absoluteUrl(mediaUrl(imageUrl) ?? imageUrl, origin) : "";
      if (!image) return ""; // Meta exige imagem por item
      const desc = p.short_description || p.description || p.name;
      return `    <item>
      <g:id>${esc(p.slug)}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${esc(desc)}</g:description>
      <g:link>${esc(link)}</g:link>
      <g:image_link>${esc(image)}</g:image_link>
      <g:availability>${p.in_stock ? "in stock" : "out of stock"}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${priceBRL(p.price_cents)}</g:price>
      <g:brand>${esc(p.brand || "Elisa Hoeppers")}</g:brand>
    </item>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Loja Elisa Hoeppers</title>
    <link>${SITE_URL}/loja</link>
    <description>Catálogo de produtos para o Instagram Shopping</description>
${items}
  </channel>
</rss>`;
}

export const Route = createFileRoute("/api/public/instagram-feed.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { data } = await supabase
          .from("products")
          .select("slug, name, short_description, description, price_cents, in_stock, brand, gallery")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        const xml = buildFeed((data ?? []) as FeedProduct[], new URL(request.url).origin);

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
