import { Link } from "@tanstack/react-router";

const HomeBodyoga = () => {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-6 md:gap-10 items-center">
        <img
          src="/images/home/bodyoga/bodyoga-1.png"
          alt="Mulher praticando Bodyoga com pesinho"
          className="rounded-lg object-cover aspect-square w-full"
        />
        <div className="text-center px-2 md:px-6">
          <h2 className="font-display text-5xl md:text-6xl text-primary-dark mb-6 tracking-wide">
            BODYOGA<span className="text-2xl align-super">®</span>
          </h2>
          <p className="text-primary-dark text-xs md:text-sm uppercase tracking-wider leading-relaxed max-w-xl mx-auto mb-8 font-medium">
            No Bodyoga os pezinhos transformam e elevam a prática de yoga a outro nível.
            Mais força, mais resistência, mais conexão. Tudo isso sem perder a essência do yoga:
            corpo e mente em equilíbrio.
          </p>
          <Link
            to="/cursos"
            className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs hover:bg-primary-dark transition"
          >
            Saiba mais
          </Link>
        </div>
        <img
          src="/images/home/bodyoga/bodyoga-2.png"
          alt="Detalhe dos pesinhos Bodyoga"
          className="rounded-lg object-cover aspect-square w-full"
        />
      </div>
    </section>
  );
};

export default HomeBodyoga;
