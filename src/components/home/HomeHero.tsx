import { Link } from "@tanstack/react-router";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";

const YOUTUBE_ID = "h5ztu79aj4k";

const HomeHero = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 8000 })]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="relative w-full h-[70vh] md:h-[80vh] min-h-[520px] overflow-hidden bg-black">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {/* Slide 1: Vídeo */}
          <div className="relative flex-[0_0_100%] min-w-0 h-full">
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
              <Link
                to="/agende-sua-aula"
                className="bg-primary/80 backdrop-blur-sm text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-primary transition"
              >
                AGENDE SUA AULA
              </Link>
            </div>
          </div>

          {/* Slide 2: Chamada Bodyoga */}
          <div className="relative flex-[0_0_100%] min-w-0 h-full">
            <div className="absolute inset-0">
              <img 
                src="/images/home/bodyoga/bodyoga-left.png" 
                alt="Bodyoga" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
              <img
                src="/images/home/bodyoga/logo-bodyoga.png"
                alt="BODYOGA®"
                className="h-28 md:h-44 w-auto mb-2 brightness-0 invert"
              />
              <p className="text-white/80 text-lg md:text-xl font-light tracking-[0.15em] mb-10 max-w-2xl italic">
                Corpo forte, mente tranquila.
              </p>
              <Link
                to="/cursos"
                className="bg-white text-primary-dark px-10 py-3 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-primary-dark hover:text-white transition"
              >
                SAIBA MAIS
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <button 
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/50 hover:text-white transition"
      >
        <ChevronLeft size={32} />
      </button>
      <button 
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/50 hover:text-white transition"
      >
        <ChevronRight size={32} />
      </button>
    </section>
  );
};

export default HomeHero;
