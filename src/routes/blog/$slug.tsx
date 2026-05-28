import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { getPostBySlug, listPublishedPosts, parseMarkdownBlocks, type RenderBlock } from "@/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.post.title} — Elisa Hoeppers` },
      { name: "description", content: loaderData?.post.excerpt ?? "" },
      { property: "og:title", content: loaderData?.post.title },
      { property: "og:description", content: loaderData?.post.excerpt ?? undefined },
      { property: "og:image", content: loaderData?.post.cover_image ?? undefined },
      { property: "og:type", content: "article" },
    ],
  }),
  component: BlogPost,
});

function renderBlock(b: RenderBlock, idx: number) {
  if (b.type === "h2") {
    return (
      <h2 key={idx} className="font-display text-2xl md:text-3xl mt-10 mb-4">
        {b.text}
      </h2>
    );
  }
  if (b.type === "h3") {
    return (
      <h3 key={idx} className="font-display text-xl md:text-2xl mt-8 mb-3">
        {b.text}
      </h3>
    );
  }
  return (
    <p key={idx} className="text-primary/80 leading-relaxed mb-5 whitespace-pre-line">
      {b.text}
    </p>
  );
}

function BlogPost() {
  const { post } = Route.useLoaderData();

  const { data: others } = useQuery({
    queryKey: ["blog-others", post.slug],
    queryFn: async () => (await listPublishedPosts()).filter((p) => p.slug !== post.slug).slice(0, 2),
  });

  const blocks = parseMarkdownBlocks(post.body_md ?? "");

  return (
    <Layout>
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-[1170px] mx-auto px-4 md:px-6 text-center text-white">
            <Link to="/blog" className="inline-block text-white/80 hover:text-white text-sm mb-4 transition-colors">
              ← Dicas e Novidades
            </Link>
            {post.published_at && (
              <span className="block text-white/80 text-sm mb-3">
                {new Date(post.published_at).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
            <h1 className="font-display text-3xl md:text-5xl leading-tight">{post.title}</h1>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-[720px] mx-auto px-4 md:px-6">
          {post.excerpt && (
            <p className="text-lg text-primary/70 italic mb-10 leading-relaxed">{post.excerpt}</p>
          )}
          <div>{blocks.map((b, i) => renderBlock(b, i))}</div>
        </div>
      </section>

      {(others?.length ?? 0) > 0 && (
        <section className="pb-20 md:pb-28 bg-cream">
          <div className="max-w-[1170px] mx-auto px-4 md:px-6">
            <h2 className="font-display text-2xl md:text-3xl mb-10 text-center">Continue lendo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(others ?? []).map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group block overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {p.cover_image && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-sans font-light text-xl text-primary group-hover:text-primary/70 transition-colors">
                      {p.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
