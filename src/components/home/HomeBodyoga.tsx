import { Link } from "@tanstack/react-router";

const HomeBodyoga = () => {
  return (
    <section className="py-24 md:py-40 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">
        <div className="w-full md:w-[25%] flex justify-center">
          <img
            src="/images/home/bodyoga/bodyoga-1.png"
            alt="Mulher praticando Bodyoga com pesinho"
            className="rounded-lg object-cover aspect-[4/5] w-full max-w-[320px] shadow-sm"
          />
        </div>
        
        <div className="flex-1 text-center px-4 flex flex-col items-center">
          <img 
            src="/images/home/bodyoga/logo-bodyoga.png" 
            alt="BODYOGA®" 
            className="h-14 md:h-20 w-auto mb-12"
            style={{ filter: "brightness(0) saturate(100%) invert(24%) sepia(16%) saturate(1013%) hue-rotate(53deg) brightness(98%) contrast(85%)" }}
          />
          <p className="text-[#4A5568] text-[13px] md:text-[14px] uppercase tracking-[0.2em] md:tracking-[0.3em] leading-[2.2] md:leading-[2.5] max-w-2xl mx-auto mb-12 font-medium">
            No BODYOGA os pezinhos transformam e elevam a prática de yoga a outro nível. Mais força, mais resistência, mais conexão. Tudo isso sem perder a essência do yoga: corpo e mente em equilíbrio.
          </p>
          <Link
            to="/cursos"
            className="inline-block bg-primary text-white px-14 py-4 rounded-full uppercase tracking-[0.25em] text-[11px] font-bold hover:bg-primary-dark transition-all duration-300 shadow-md hover:shadow-lg"
          >
            SAIBA MAIS
          </Link>
        </div>

        <div className="w-full md:w-[25%] flex justify-center">
          <img
            src="/images/home/bodyoga/bodyoga-2.png"
            alt="Detalhe dos pesinhos Bodyoga"
            className="rounded-lg object-cover aspect-[4/5] w-full max-w-[320px] shadow-sm"
          />
        </div>
      </div>
    </section>
  );
};

export default HomeBodyoga;
