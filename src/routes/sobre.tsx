import { createFileRoute, Link } from "@tanstack/react-router";
import Layout from "@/components/Layout";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Elisa Hoeppers" },
      {
        name: "description",
        content:
          "Conheça Elisa Hoeppers: professora de Hatha e Vinyasa Yoga há 18 anos, formada também em yoga para crianças e adolescentes e em yogaterapia.",
      },
      { property: "og:title", content: "Sobre — Elisa Hoeppers" },
      {
        property: "og:description",
        content: "Conheça Elisa Hoeppers: professora de Hatha e Vinyasa Yoga há 18 anos.",
      },
      { property: "og:image", content: "/images/home/bio/elisa-perfil.png" },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <Layout>
      <section className="py-20 md:py-28 bg-cream min-h-screen">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-6 text-primary-dark text-base md:text-lg leading-relaxed order-2 md:order-1">
            <h1 className="font-display text-4xl md:text-5xl text-primary-dark mb-4">
              Elisa Hoeppers — Yoga e Cuidado Consciente
            </h1>
            <p>
              Sou professora de Hatha e Vinyasa Yoga. Iniciei a prática pessoal há 18 anos.
              Em 2014, quando estive na Índia, no Ashram da Amma, iniciei o aprofundamento
              no estudo das técnicas de Yoga. Desde então, passei a me dedicar também à
              disseminação do Yoga.
            </p>
            <p>
              Obtive minha primeira formação em yoga para crianças e adolescentes e continuei
              com cursos de Hatha e Vinyasa, além de outros como didática aplicada ao Yoga e
              Yogaterapia.
            </p>
            <p>
              Vejo o Yoga como uma ferramenta para desenvolver respeito e carinho consigo
              mesma e com os outros, lapidar o ser humano em sua essência e reduzir o
              sofrimento.
            </p>
            <Link
              to="/agende-sua-aula"
              className="inline-block mt-10 bg-primary text-white px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
            >
              AGENDE SUA AULA
            </Link>
          </div>
          <div className="order-1 md:order-2 w-full">
            <img
              src="/images/home/bio/elisa-perfil.png"
              alt="Retrato de Elisa Hoeppers com folha de costela-de-adão"
              className="rounded-lg w-full aspect-[3/4] object-cover shadow-sm"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}
