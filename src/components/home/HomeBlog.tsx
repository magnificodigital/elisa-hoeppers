import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import SectionTitle from "@/components/SectionTitle";
import { listPublishedPosts } from "@/lib/blog";

const HomeBlog = () => {
  const { data: posts } = useQuery({
    queryKey: ["blog-posts-home"],
    queryFn: listPublishedPosts,
  });

  const visible = (posts ?? []).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-bodyoga-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <SectionTitle subtitle="Encontre a harmonia e as boas energias que você precisa">
          Dicas e Novidades
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-12">
          {visible.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group relative aspect-[3/4] overflow-hidden block"
            >
              {p.cover_image && (
                <img
                  src={p.cover_image}
                  alt={p.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
              <div className="absolute inset-0 px-6 flex items-center justify-center text-center">
                <h3 className="font-sans font-light text-white text-xl md:text-2xl leading-relaxed">
                  {p.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeBlog;
