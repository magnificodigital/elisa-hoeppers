import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPageBySlug } from "@/lib/pages";
import { RenderBlocks } from "@/components/admin/RenderBlocks";
import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const page = await getPageBySlug(params.slug);
    if (!page || page.status !== "active") {
      throw notFound();
    }
    return page;
  },
  component: PageView,
  head: ({ loaderData: page }) => {
    if (!page) return { title: "Página não encontrada" };
    return {
      title: `${page.title} — BODYOGA`,
      meta: [
        { name: "description", content: page.seo_description || "" },
        { property: "og:title", content: page.seo_title || page.title },
        { property: "og:description", content: page.seo_description || "" },
        { property: "og:image", content: page.og_image || "" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function PageView() {
  const page = Route.useLoaderData();

  return (
    <div className="bodyoga-scope bg-bodyoga-cream text-bodyoga-green min-h-screen">
      <BodyogaHeader alwaysGreen />
      <RenderBlocks blocks={page.content_blocks || page.blocks || []} />
      <Footer />
    </div>
  );
}