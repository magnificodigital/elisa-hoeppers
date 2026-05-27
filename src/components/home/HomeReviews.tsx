import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Quote } from "lucide-react";
import SectionTitle from "@/components/SectionTitle";
import { StarRating } from "@/components/StarRating";
import { listTopReviewsForHome } from "@/lib/reviews";

const HomeReviews = () => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["home-top-reviews"],
    queryFn: () => listTopReviewsForHome(3),
  });

  if (!isLoading && (reviews?.length ?? 0) === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-cream/40">
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionTitle subtitle="O que as alunas estão dizendo">Avaliações</SectionTitle>

        {isLoading && (
          <p className="text-center text-[var(--text-muted)] mt-10">Carregando…</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {(reviews ?? []).map((r) => (
            <article
              key={r.id}
              className="bg-white rounded-xl border border-border p-6 flex flex-col"
            >
              <Quote className="w-7 h-7 text-primary/40 mb-3" />
              <StarRating value={r.rating} size={16} className="mb-3" />
              {r.comment && (
                <p className="text-primary-dark/90 text-sm leading-relaxed italic flex-1">
                  “{r.comment}”
                </p>
              )}
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-sm font-medium text-primary-dark">
                  {r.author_name ?? "Aluna"}
                </p>
                {r.course && (
                  <Link
                    to="/cursos/$slug"
                    params={{ slug: r.course.slug }}
                    className="text-xs uppercase tracking-widest text-primary hover:opacity-70 mt-1 inline-block"
                  >
                    {r.course.overlay_label ?? r.course.title}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeReviews;
