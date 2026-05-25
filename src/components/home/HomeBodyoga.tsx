import { Link } from "@tanstack/react-router";

const HomeBodyoga = () => {
  return (
    <section className="py-20 md:py-28 bg-cream overflow-hidden">
      <div className="w-full relative flex flex-col md:flex-row items-center justify-between min-h-[500px] md:min-h-[600px]">
        {/* Foto lateral esquerda - colada na borda */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[25%] lg:w-[28%]">
          <img
            src="/images/home/bodyoga/bodyoga-left.png"
            alt="Prática de Bodyoga - Esquerda"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Conteúdo Central */}
        <div className="flex-1 flex flex-col items-center text-center px-8 md:px-12 z-10 mx-auto max-w-xl">
          <img
            src="/images/home/bodyoga/logo-bodyoga.png"
            alt="BODYOGA®"
            className="h-24 md:h-36 w-auto mb-10"
            style={{ filter: "brightness(0) saturate(100%) invert(24%) sepia(16%) saturate(1013%) hue-rotate(53deg) brightness(98%) contrast(85%)" }}
          />
          <p className="text-primary-dark text-[11px] md:text-[13px] uppercase tracking-[0.2em] leading-[2.2] mb-10 font-normal">
            No BODYOGA os pezinhos transformam e elevam a prática de yoga a outro nível. Mais força, mais resistência, mais conexão. Tudo isso sem perder a essência do yoga: corpo e mente em equilíbrio.
          </p>
          <Link
            to="/cursos"
            className="text-primary-dark text-xs md:text-sm uppercase tracking-[0.3em] font-semibold border-b border-primary-dark pb-1 hover:opacity-70 transition-opacity"
          >
            SAIBA MAIS
          </Link>
        </div>

        {/* Mobile images display (opcional, se quiser manter no mobile similar ao desktop) */}
        <div className="md:hidden flex w-full gap-2 mt-12 px-4">
           <img src="/images/home/bodyoga/bodyoga-left.png" className="w-1/2 aspect-[3/4] object-cover rounded-sm" alt="" />
           <img src="/images/home/bodyoga/bodyoga-right.png" className="w-1/2 aspect-[3/4] object-cover rounded-sm" alt="" />
        </div>

        {/* Foto lateral direita - colada na borda */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[25%] lg:w-[28%]">
          <img
            src="/images/home/bodyoga/bodyoga-right.png"
            alt="Prática de Bodyoga - Direita"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default HomeBodyoga;
