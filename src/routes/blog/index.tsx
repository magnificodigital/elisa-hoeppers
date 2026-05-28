import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { listPublishedPosts } from "@/lib/blog";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Dicas e Novidades — Elisa Hoeppers" },
      { name: "description", content: "Dicas sobre yoga, meditação e aromaterapia com Elisa Hoeppers." },
    ],
  }),
  component: BlogListing,
});

function BlogListing() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: listPublishedPosts,
  });

  return (
    <Layout>
      <section className="py-20 md:py-28 bg-cream">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl mb-4">Dicas e Novidades</h1>
            <p className="text-lg text-primary/70 max-w-2xl mx-auto">
              Encontre a harmonia e as boas energias que você precisa com aulas de yoga e aromaterapia! A prática do yoga, aliada aos benefícios terapêuticos dos óleos essenciais, pode transformar sua vida e trazer equilíbrio para seu corpo e mente.
            </p>
          </div>

          {isLoading && <p className="text-center text-primary/60">Carregando posts…</p>}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mt-12">
            {(posts ?? []).map((p, i) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className={`group relative aspect-[3/4] overflow-hidden block ${i === 0 ? "md:col-span-2 md:aspect-auto" : "md:col-span-1"}`}
              >
                {p.cover_image && (
                  <img
                    src={p.cover_image}
                    alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
                <div className="absolute inset-0 px-6 flex items-center justify-center text-center">
                  <div>
                    {p.published_at && (
                      <span className="block text-white/80 text-sm mb-2">
                        {new Date(p.published_at).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    )}
                    <h3 className="font-sans font-light text-white text-xl md:text-2xl leading-relaxed">
                      {p.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
