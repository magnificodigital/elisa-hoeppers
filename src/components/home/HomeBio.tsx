import { Link } from "@tanstack/react-router";

const HomeBio = () => {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <img
          src="/images/home/elisa-bio.jpg"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1599447332411-fd6ca54a1d23?w=900&q=80";
          }}
          alt="Elisa Hoeppers"
          className="rounded-lg w-full aspect-square object-cover order-2 md:order-1"
        />
        <div className="order-1 md:order-2">
          <h2 className="font-display text-3xl md:text-[2rem] text-primary-dark mb-6">
            Elisa Hoeppers
          </h2>
          <div className="space-y-4 text-[var(--text-muted)] text-sm md:text-base leading-relaxed">
            <p>
              Sou professora de Hatha e Vinyasa Yoga há mais de 18 anos. Minha trajetória começou
              com a busca pelo equilíbrio entre corpo, mente e espírito.
            </p>
            <p>
              Em 2014, fiz uma viagem transformadora à Índia, onde vivi no Ashram da Amma e
              aprofundei meus estudos das técnicas tradicionais do yoga, da meditação e da
              aromaterapia.
            </p>
            <p>
              Desde então, dedico minha vida a compartilhar o yoga como caminho de equilíbrio,
              saúde e paz interior — guiando alunos para descobrirem a vibração de uma prática
              ampla e profundamente transformadora.
            </p>
            <p>
              Hoje, meu maior propósito é ajudar outras pessoas a encontrarem o bem-estar
              através das práticas que mudaram a minha vida.
            </p>
          </div>
          <Link
            to="/sobre"
            className="inline-block mt-8 bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs hover:bg-primary-dark transition"
          >
            Saiba mais
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeBio;
