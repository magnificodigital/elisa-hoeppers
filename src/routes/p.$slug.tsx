import { createFileRoute } from "@tanstack/react-router";
import { getPageBySlug } from "@/lib/pages";
import { RenderBlocks } from "@/components/admin/RenderBlocks";

import { notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const page = await getPageBySlug(params.slug);
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => ({
    title: loaderData?.seo_title || `${loaderData?.title} — BODYOGA`,
    meta: [
      { name: "description", content: loaderData?.seo_description || "" },
      { property: "og:title", content: loaderData?.seo_title || loaderData?.title },
      { property: "og:description", content: loaderData?.seo_description || "" },
      { property: "og:image", content: loaderData?.og_image || "" },
    ],
  }),
  component: PageComponent,
});

function PageComponent() {
  const page = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <RenderBlocks blocks={page.blocks || []} />
    </div>
  );
}
