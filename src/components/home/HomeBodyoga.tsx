import { Link } from "@tanstack/react-router";

const HomeBodyoga = () => {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        <div className="w-full md:w-[22%] flex justify-center">
          <img
            src="/images/home/bodyoga/bodyoga-1.png"
            alt="Mulher praticando Bodyoga com pesinho"
            className="rounded-sm object-cover aspect-[3/4] w-full max-w-[340px]"
          />
        </div>

        <div className="flex-1 flex flex-col items-center text-center px-4">
          <img
            src="/images/home/bodyoga/logo-bodyoga.png"
            alt="BODYOGA®"
            className="h-16 md:h-24 w-auto mb-10"
            style={{ filter: "brightness(0) saturate(100%) invert(24%) sepia(16%) saturate(1013%) hue-rotate(53deg) brightness(98%) contrast(85%)" }}
          />
          <p className="text-primary-dark text-[11px] md:text-[13px] uppercase tracking-[0.2em] leading-[2] max-w-xl mx-auto mb-8 font-normal">
            No BODYOGA os pezinhos transformam e elevam a prática de yoga a outro nível. Mais força, mais resistência, mais conexão. Tudo isso sem perder a essência do yoga: corpo e mente em equilíbrio.
          </p>
          <Link
            to="/cursos"
            className="text-primary-dark text-xs md:text-sm uppercase tracking-[0.3em] font-semibold border-b border-primary-dark pb-1 hover:opacity-70 transition-opacity"
          >
            SAIBA MAIS
          </Link>
        </div>

        <div className="w-full md:w-[22%] flex justify-center">
          <img
            src="/images/home/bodyoga/bodyoga-2.png"
            alt="Detalhe dos pesinhos Bodyoga"
            className="rounded-sm object-cover aspect-[3/4] w-full max-w-[340px]"
          />
        </div>
      </div>
    </section>
  );
};

export default HomeBodyoga;
