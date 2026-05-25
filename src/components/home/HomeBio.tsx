import { Link } from "@tanstack/react-router";

const HomeBio = () => {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <img
          src="/images/home/bio/elisa-perfil.png"
          alt="Retrato de Elisa Hoeppers"
          className="rounded-lg w-full aspect-square object-cover order-2 md:order-1"
        />
        <div className="order-1 md:order-2">
          <h2 className="font-display text-3xl md:text-[2rem] text-primary-dark mb-6">
            Elisa Hoeppers
          </h2>
          <div className="space-y-4 text-[var(--text-muted)] text-sm md:text-base leading-relaxed">
            <p>
              Sou professora de Hatha e Vinyasa Yoga e fundadora do BODYOGA. Há 18 anos,
              iniciei minha jornada pessoal com o yoga, um caminho que me levou a descobrir
              um profundo amor e respeito por essa prática milenar.
            </p>
            <p>
              Em 2014, tive a oportunidade de aprofundar meus estudos no Ashram da Amma,
              na Índia, mergulhando nas técnicas e filosofias do yoga. Desde então, tenho
              dedicado minha vida não apenas à minha prática, mas também à disseminação dos
              ensinamentos do yoga.
            </p>
            <p>
              Minha missão é compartilhar os benefícios transformadores do yoga, ajudando
              os outros a encontrar equilíbrio, saúde e paz interior. Estou aqui para
              guiá-lo em sua jornada de yoga e bem-estar.
            </p>
          </div>
          <Link
            to="/sobre"
            className="inline-block mt-8 bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs hover:bg-primary-dark transition"
          >
            SAIBA MAIS
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeBio;
