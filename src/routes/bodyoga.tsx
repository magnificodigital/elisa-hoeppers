import { createFileRoute, Link } from "@tanstack/react-router";
import Layout from "@/components/Layout";

export const Route = createFileRoute("/bodyoga")({
  head: () => ({
    meta: [
      { title: "Bodyoga — Elisa Hoeppers" },
      {
        name: "description",
        content:
          "Bodyoga: a metodologia de Elisa Hoeppers que une consciência corporal e práticas de yoga para fortalecer corpo e mente.",
      },
      { property: "og:title", content: "Bodyoga — Elisa Hoeppers" },
      {
        property: "og:description",
        content:
          "Bodyoga: a metodologia de Elisa Hoeppers que une consciência corporal e práticas de yoga.",
      },
    ],
  }),
  component: Bodyoga,
});

function Bodyoga() {
  return (
    <Layout>
      <section className="py-20 md:py-28 bg-cream min-h-screen">
        <div className="max-w-[900px] mx-auto px-4 md:px-6 text-primary-dark">
          <h1 className="text-3xl md:text-5xl font-light tracking-wide mb-8">
            Bodyoga
          </h1>
          <div className="space-y-6 text-base md:text-lg leading-relaxed">
            <p>
              Bodyoga é a metodologia desenvolvida por Elisa Hoeppers, unindo
              consciência corporal, respiração e os princípios do Hatha e Vinyasa
              Yoga para fortalecer corpo e mente de forma integrada.
            </p>
            <p>
              Mais do que uma sequência de posturas, o Bodyoga é um convite para
              reconectar-se com o próprio corpo, desenvolver presença e cultivar
              equilíbrio no dia a dia.
            </p>
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/cursos"
              className="border border-primary text-primary px-8 py-3 rounded-full text-[12px] tracking-[0.15em] uppercase hover:bg-primary hover:text-cream transition-all font-semibold"
            >
              Ver aulas
            </Link>
            <Link
              to="/agende-sua-aula"
              className="border border-primary text-primary px-8 py-3 rounded-full text-[12px] tracking-[0.15em] uppercase hover:bg-primary hover:text-cream transition-all font-semibold"
            >
              Agende sua aula
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
