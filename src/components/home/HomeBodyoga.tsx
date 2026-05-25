import { Link } from "@tanstack/react-router";

const HomeBodyoga = () => {
  return (
    <section className="py-24 md:py-40 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-20">
        <div className="w-full md:w-[30%]">
          <img
            src="/images/home/bodyoga/bodyoga-1.png"
            alt="Mulher praticando Bodyoga com pesinho"
            className="rounded-lg object-cover aspect-[4/5] w-full shadow-sm"
          />
        </div>
        
        <div className="flex-1 text-center px-4">
          <h2 className="font-display text-6xl md:text-[5rem] text-primary-dark mb-10 tracking-[0.05em]">
            BODYOGA<span className="text-3xl align-super ml-1">®</span>
          </h2>
          <p className="text-primary-dark text-xs md:text-[13px] uppercase tracking-[0.25em] leading-[2.2] max-w-2xl mx-auto mb-12 font-medium">
            No BODYOGA os pezinhos transformam e elevam a prática de yoga a outro nível. Mais força, mais resistência, mais conexão. Tudo isso sem perder a essência do yoga: corpo e mente em equilíbrio.
          </p>
          <Link
            to="/cursos"
            className="inline-block bg-primary text-white px-12 py-4 rounded-full uppercase tracking-[0.25em] text-[11px] font-semibold hover:bg-primary-dark transition-all duration-300"
          >
            SAIBA MAIS
          </Link>
        </div>

        <div className="w-full md:w-[30%]">
          <img
            src="/images/home/bodyoga/bodyoga-2.png"
            alt="Detalhe dos pesinhos Bodyoga"
            className="rounded-lg object-cover aspect-[4/5] w-full shadow-sm"
          />
        </div>
      </div>
    </section>
  );
};

export default HomeBodyoga;
