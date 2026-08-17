import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { mediaUrl } from "@/lib/storage";

const SITE_URL = "https://bodyogaoficial.com.br";
const FALLBACK_IMAGE = `${SITE_URL}/images/home/bodyoga/logo-bodyoga.png`;

type FeedProduct = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  in_stock: boolean;
  brand: string | null;
  gallery: { url?: string }[] | null;
};

/** Converte qualquer URL de mídia em URL absoluta e pública (Meta exige). */
function absImage(url: string | null | undefined): string {
  if (!url) return "";
  const resolved = mediaUrl(url) ?? url;
  if (/^https?:\/\//i.test(resolved)) return resolved;
  return `${SITE_URL}${resolved.startsWith("/") ? "" : "/"}${resolved}`;
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cdata(value: string): string {
  return `<![CDATA[${(value ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

function money(cents: number): string {
  return `${(cents / 100).toFixed(2)} BRL`;
}

function buildFeed(products: FeedProduct[]): string {
  const items = products
    .map((p) => {
      const gallery = Array.isArray(p.gallery) ? p.gallery : [];
      const images = gallery.map((g) => absImage(g?.url)).filter(Boolean);
      const image = images[0] || FALLBACK_IMAGE;
      const extra = images.slice(1, 10);
      const hasSale =
        p.compare_at_price_cents != null &&
        p.compare_at_price_cents > p.price_cents;
      // Google/Meta: price = valor cheio; sale_price = valor promocional.
      const fullPrice = hasSale ? p.compare_at_price_cents! : p.price_cents;
      const description =
        stripHtml(p.description) || stripHtml(p.short_description) || p.name;

      return `    <item>
      <g:id>${p.id}</g:id>
      <g:title>${cdata(p.name)}</g:title>
      <g:description>${cdata(description)}</g:description>
      <g:link>${SITE_URL}/loja/${p.slug}</g:link>
      <g:image_link>${image}</g:image_link>${extra
        .map((u) => `\n      <g:additional_image_link>${u}</g:additional_image_link>`)
        .join("")}
      <g:availability>${p.in_stock ? "in stock" : "out of stock"}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${money(fullPrice)}</g:price>${
        hasSale ? `\n      <g:sale_price>${money(p.price_cents)}</g:sale_price>` : ""
      }
      <g:brand>${cdata(p.brand || "BODYOGA")}</g:brand>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>BODYOGA — Catálogo de produtos</title>
    <link>${SITE_URL}</link>
    <description>Feed de produtos BODYOGA para Meta / Instagram Shopping</description>
${items}
  </channel>
</rss>`;
}

export const Route = createFileRoute("/feed-meta.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data } = await supabase
          .from("products")
          .select(
            "id, slug, name, short_description, description, price_cents, compare_at_price_cents, in_stock, brand, gallery",
          )
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        const xml = buildFeed((data ?? []) as FeedProduct[]);

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
