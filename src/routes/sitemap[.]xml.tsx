import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

const SITE_URL = "https://bodyogaoficial.com.br";

function buildSitemap(
  posts: { slug: string; updated_at?: string | null }[],
  courses: { slug: string; updated_at?: string | null }[],
  products: { slug: string; updated_at?: string | null }[],
) {
  const staticPages = [
    { url: "/", changefreq: "weekly", priority: 1.0 },
    { url: "/sobre", changefreq: "monthly", priority: 0.8 },
    { url: "/cursos", changefreq: "weekly", priority: 0.9 },
    { url: "/loja", changefreq: "daily", priority: 0.9 },
    { url: "/blog", changefreq: "weekly", priority: 0.8 },
    { url: "/agende-sua-aula", changefreq: "weekly", priority: 0.9 },
    { url: "/perfumista", changefreq: "monthly", priority: 0.6 },
    { url: "/bio", changefreq: "monthly", priority: 0.6 },
    { url: "/privacidade", changefreq: "yearly", priority: 0.2 },
    { url: "/termos", changefreq: "yearly", priority: 0.2 },
  ];

  const urls = [
    ...staticPages.map((p) => ({
      loc: `${SITE_URL}${p.url}`,
      changefreq: p.changefreq,
      priority: p.priority,
      lastmod: undefined as string | undefined,
    })),
    ...posts.map((p) => ({
      loc: `${SITE_URL}/blog/${p.slug}`,
      changefreq: "monthly",
      priority: 0.7,
      lastmod: p.updated_at ?? undefined,
    })),
    ...courses.map((c) => ({
      loc: `${SITE_URL}/cursos/${c.slug}`,
      changefreq: "weekly",
      priority: 0.8,
      lastmod: c.updated_at ?? undefined,
    })),
    ...products.map((p) => ({
      loc: `${SITE_URL}/loja/${p.slug}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: p.updated_at ?? undefined,
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [posts, courses, products] = await Promise.all([
          supabase.from("posts").select("slug, updated_at").eq("is_published", true),
          supabase.from("courses").select("slug, updated_at").eq("is_published", true),
          supabase.from("products").select("slug, updated_at").eq("is_active", true),
        ]);

        const xml = buildSitemap(
          posts.data ?? [],
          courses.data ?? [],
          products.data ?? [],
        );

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
