import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { listPublishedCourses } from "@/lib/courses";

export const Route = createFileRoute("/cursos/")({
  head: () => ({
    meta: [
      { title: "Aulas — Elisa Hoeppers" },
      { name: "description", content: "Conheça as aulas de yoga, meditação e BODYOGA com Elisa Hoeppers." },
    ],
  }),
  component: CursosListing,
});

function CursosListing() {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["courses", "published"],
    queryFn: listPublishedCourses,
  });

  return (
    <Layout>
      <section className="py-20 md:py-28 bg-cream min-h-screen">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6">
          <h1 className="font-display text-4xl md:text-5xl text-primary-dark text-center mb-4">
            Aulas
          </h1>
          <p className="text-center text-[var(--text-muted)] max-w-2xl mx-auto mb-12">
            Encontre a harmonia e energia que você precisa, em nossas aulas.
          </p>

          {isLoading && <p className="text-center text-primary-dark">Carregando aulas…</p>}
          {error && <p className="text-center text-red-700">Erro ao carregar aulas.</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {(courses ?? []).map((c) => (
              <Link
                key={c.id}
                to="/cursos/$slug"
                params={{ slug: c.slug }}
                className="flex flex-col group"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  {c.cover_image && (
                    <img
                      src={c.cover_image}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/10" />
                  <span className="absolute top-3 left-3 bg-white/85 text-primary-dark text-[10px] uppercase tracking-wider px-2 py-1 rounded">
                    Todos os níveis
                  </span>
                </div>
                <div className="mt-5 text-center">
                  <p className="text-primary-dark font-medium">{c.title}</p>
                  {c.subtitle && (
                    <p className="text-[var(--text-muted)] text-sm mt-1">{c.subtitle}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
