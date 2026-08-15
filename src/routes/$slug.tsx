import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPageBySlug } from "@/lib/pages";
import { RenderBlocks } from "@/components/admin/RenderBlocks";
import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const page = await getPageBySlug(params.slug);
    if (!page || page.status !== "active") throw notFound();
    return page;
  },
  head: ({ loaderData }) => ({
    title: loaderData?.seo_title || loaderData?.title,
    meta: loaderData?.seo_description ? [{ name: "description", content: loaderData.seo_description }] : [],
  }),
  component: () => {
    const page = Route.useLoaderData();
    return (
      <div className="bodyoga-scope bg-bodyoga-cream text-bodyoga-green min-h-screen">
        <BodyogaHeader alwaysGreen />
        <RenderBlocks blocks={page.content_blocks || (page as any).blocks || []} />
        <Footer />
      </div>
    );
  },
});
