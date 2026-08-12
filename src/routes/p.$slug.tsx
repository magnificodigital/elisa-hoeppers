import { createFileRoute, notFound } from "@tanstack/react-router";
import Layout from "@/components/Layout";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PageBlocksRenderer } from "@/components/pages/PageBlockRenderer";
import { getPageBySlug } from "@/lib/pages";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const page = await getPageBySlug(params.slug);
    if (!page || !page.is_published) throw notFound();
    return { page };
  },
  head: ({ loaderData, params }) => {
    const page = loaderData?.page;
    const url = `https://bodyogaoficial.com.br/p/${params.slug}`;
    if (!page) {
      return { meta: [{ title: "Página não encontrada — BODYOGA" }, { name: "robots", content: "noindex" }] };
    }
    const title = page.seo_title || `${page.title} — BODYOGA`;
    const description = page.seo_description || "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(page.hero_image
          ? [
              { property: "og:image", content: page.hero_image },
              { name: "twitter:image", content: page.hero_image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: () => (
    <Layout>
      <div className="py-24 text-center bg-cream min-h-[60vh]">
        <p className="text-primary-dark/60">Não foi possível carregar esta página.</p>
      </div>
    </Layout>
  ),
  notFoundComponent: () => (
    <Layout>
      <div className="py-24 text-center bg-cream min-h-[60vh]">
        <h1 className="font-display text-3xl text-primary-dark mb-2">Página não encontrada</h1>
        <p className="text-primary-dark/60">O endereço que você acessou não existe ou não está publicado.</p>
      </div>
    </Layout>
  ),
  component: PublicPage,
});

function PublicPage() {
  const { page } = Route.useLoaderData();
  const hasBlocks = Array.isArray(page.content_blocks) && page.content_blocks.length > 0;

  return (
    <Layout>
      {page.hero_image && (
        <section className="relative h-[38vh] md:h-[50vh] overflow-hidden">
          <img src={page.hero_image} alt={page.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary-dark/35" />
        </section>
      )}
      <div className="bg-cream pb-16 md:pb-24">
        <section className="pt-16 md:pt-24">
          <div className="max-w-[860px] mx-auto px-4 md:px-6">
            <h1 className="font-display text-3xl md:text-5xl text-primary-dark">{page.title}</h1>
          </div>
        </section>
        {hasBlocks ? (
          <PageBlocksRenderer blocks={page.content_blocks} />
        ) : (
          <div className="max-w-[720px] mx-auto px-4 md:px-6 pt-8">
            <MarkdownContent content={page.content_md} />
          </div>
        )}
      </div>
    </Layout>
  );
}
