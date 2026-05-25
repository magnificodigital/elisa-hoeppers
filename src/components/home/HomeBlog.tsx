import { Link } from "@tanstack/react-router";
import { posts } from "@/data/posts";
import SectionTitle from "@/components/SectionTitle";

const HomeBlog = () => {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <SectionTitle subtitle="Encontre a harmonia e as boas energias que você precisa com aulas de yoga e aromaterapia! A prática do yoga, aliada aos benefícios terapêuticos dos óleos essenciais, pode transformar sua vida e trazer equilíbrio para seu corpo e mente.">
          Dicas e Novidades
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          {posts.map((p, i) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className={`group relative aspect-[3/4] rounded-lg overflow-hidden block ${i === 0 ? "md:col-span-2" : "md:col-span-1"}`}
            >
              <img
                src={p.image}
                alt={p.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
              <div className="absolute inset-0 p-6 flex items-center justify-center text-center">
                <h3 className="font-sans font-light text-white text-xl md:text-2xl leading-snug">
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
