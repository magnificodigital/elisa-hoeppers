import { Link } from "@tanstack/react-router";

const YOUTUBE_ID = "h5ztu79aj4k";

const HomeHero = () => {
  return (
    <section className="relative w-full h-[70vh] md:h-[80vh] min-h-[520px] overflow-hidden bg-black">
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <iframe
          title="Elisa Hoeppers — vídeo de apresentação"
          src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_ID}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.77vh] h-[56.25vw] min-w-full min-h-full border-0"
        />
      </div>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 h-full flex items-end justify-center pb-20 md:pb-28">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Link
            to="/agende-sua-aula"
            className="bg-primary/80 backdrop-blur-sm text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-primary transition"
          >
            AGENDE SUA AULA
          </Link>
          <Link
            to="/loja"
            className="border border-white text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-white hover:text-primary transition"
          >
            VER PRODUTOS
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
