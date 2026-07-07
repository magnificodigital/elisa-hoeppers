import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listActiveSlides, type Slide } from "@/lib/shop";
import heroBg from "@/assets/bodyoga/hero-combined-v3.jpg";

/** The original, default hero — kept as the main (first) slide. */
function DefaultHero() {
  return (
    <>
      {/* MOBILE: imagem dos produtos com botão centralizado */}
      <div className="md:hidden relative h-[70vh] min-h-[460px] w-full">
        <img
          src={heroBg}
          alt="Produtos BODYOGA"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 bottom-10 flex justify-center">
          <a
            href="#rituais"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("rituais")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-block px-7 py-3 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] shadow-lg transition"
          >
            Conhecer rituais
          </a>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <div
          className="absolute inset-0 bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: "center center", backgroundSize: "cover" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bodyoga-cream via-bodyoga-cream/85 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-bodyoga-cream pointer-events-none" />
        <div className="relative z-10 max-w-[1170px] mx-auto px-6 pt-56 pb-36 flex items-center justify-start min-h-[85vh]">
          <div className="relative max-w-xl">
            <div className="absolute -inset-x-16 -inset-y-14 backdrop-blur-md bg-[#E6DAC5]/55 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)] pointer-events-none" />
            <div className="relative">
              <h1 className="font-display text-5xl leading-tight text-bodyoga-green">
                <span className="whitespace-nowrap">Rituais para corpo,</span>
                <br />
                <span className="whitespace-nowrap">mente e ambiente.</span>
              </h1>
              <p className="mt-6 text-lg text-bodyoga-green/80 leading-relaxed">
                <span className="whitespace-nowrap">Cosméticos naturais artesanais com óleos essenciais.</span>
                <br />
                <span className="whitespace-nowrap">Criados à mão por <strong className="font-bold">Elisa Hoeppers Casas</strong>, no encontro</span>
                <br />
                <span className="whitespace-nowrap">entre o yoga e o cuidado natural.</span>
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#rituais"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("rituais")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-7 py-3 rounded-full border border-bodyoga-green text-bodyoga-green text-sm font-medium uppercase tracking-[0.18em] hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
                >
                  Conhecer rituais
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


/** Smooth-scrolls to an in-page anchor (href starting with "#"); otherwise lets the link navigate. */
function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href?: string | null) {
  if (href && href.startsWith("#")) {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }
}

/** Video slide — renders a background video (e.g. YouTube embed) from a slide. */
function VideoSlide({ slide }: { slide: Slide }) {
  const videoUrl = slide.video_url!;
  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
        <iframe
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full pointer-events-none"
          src={`${videoUrl}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&playlist=${videoUrl.split("/").pop()}`}
          title={slide.title}
          allow="autoplay; encrypted-media"
          frameBorder={0}
        />
        {/* Blocks all YouTube hover controls (play/pause/seek) from appearing */}
        <div className="absolute inset-0 z-10" />
      </div>
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 md:h-32 bg-gradient-to-b from-transparent to-bodyoga-cream pointer-events-none" />
      <div className="relative z-10 max-w-[1170px] mx-auto px-4 md:px-6 pt-40 md:pt-56 pb-24 md:pb-36 flex items-center justify-center min-h-[85vh]">
        {slide.cta_label && (
          <a
            href={slide.cta_href || "/agendar"}
            onClick={(e) => handleAnchorClick(e, slide.cta_href)}
            className="px-7 py-3 rounded-full border border-bodyoga-cream text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] hover:bg-bodyoga-green hover:border-bodyoga-green hover:text-bodyoga-cream transition"
          >
            {slide.cta_label}
          </a>
        )}
      </div>
    </>
  );
}


function CustomSlide({ slide }: { slide: Slide }) {
  const titleLines = slide.title.split("\n");
  const subtitleLines = (slide.subtitle ?? "").split("\n").filter(Boolean);
  return (
    <>
      {/* MOBILE: imagem dos produtos com botão centralizado */}
      <div className="md:hidden relative">
        {slide.image_url && (
          <img src={slide.image_url} alt={slide.title} className="w-full h-auto" loading="eager" />
        )}
        {slide.cta_label && (
          <div className="absolute inset-0 flex items-center justify-center">
            <a
              href={slide.cta_href || "#rituais"}
              onClick={(e) => handleAnchorClick(e, slide.cta_href || "#rituais")}
              className="inline-block px-7 py-3 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] shadow-lg transition"
            >
              {slide.cta_label}
            </a>
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        {slide.image_url && (
          <div
            className="absolute inset-0 bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${slide.image_url})`, backgroundPosition: "center center", backgroundSize: "cover" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-bodyoga-cream via-bodyoga-cream/85 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-bodyoga-cream pointer-events-none" />
        <div className="relative z-10 max-w-[1170px] mx-auto px-6 pt-56 pb-36 flex items-center justify-start min-h-[85vh]">
          <div className="relative max-w-xl">
            <div className="absolute -inset-x-16 -inset-y-14 backdrop-blur-md bg-[#E6DAC5]/55 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)] pointer-events-none" />
            <div className="relative">
              <h1 className="font-display text-5xl leading-tight text-bodyoga-green">
                {titleLines.map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </h1>
              {subtitleLines.length > 0 && (
                <p className="mt-6 text-lg text-bodyoga-green/80 leading-relaxed">
                  {subtitleLines.map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ))}
                </p>
              )}
              {slide.cta_label && (
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href={slide.cta_href || "#rituais"}
                    onClick={(e) => handleAnchorClick(e, slide.cta_href || "#rituais")}
                    className="px-7 py-3 rounded-full border border-bodyoga-green text-bodyoga-green text-sm font-medium uppercase tracking-[0.18em] hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
                  >
                    {slide.cta_label}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


export function BodyogaHeroSlider() {
  const { data: slides } = useQuery({
    queryKey: ["bodyoga-slides-active"],
    queryFn: listActiveSlides,
  });

  // Render DB slides; fall back to the built-in default hero when there are none.
  // A slide with a video_url renders as a video slide; otherwise as a custom slide.
  const dbSlides = slides ?? [];
  const items: ReactNode[] =
    dbSlides.length > 0
      ? dbSlides.map((s) =>
          s.video_url ? <VideoSlide key={s.id} slide={s} /> : <CustomSlide key={s.id} slide={s} />,
        )
      : [<DefaultHero key="default" />];
  // Per-slide durations (seconds) parallel to items.
  const durations: number[] =
    dbSlides.length > 0
      ? dbSlides.map((s) => s.duration_seconds ?? 7)
      : [7];


  const [index, setIndex] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count <= 1) return;
    const ms = (durations[index] ?? 7) * 1000;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), ms);
    return () => clearTimeout(t);
  }, [count, index, durations]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  return (
    <section className="relative overflow-hidden bg-bodyoga-cream -mt-24 pt-24">
      <div className="relative">
        {items.map((node, i) => (
          <div
            key={i}
            className={`transition-opacity duration-1000 ease-in-out ${i === index ? "relative opacity-100" : "absolute inset-0 opacity-0 pointer-events-none"}`}
            aria-hidden={i !== index}
          >
            {node}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => go(-1)}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-bodyoga-cream/70 text-bodyoga-green hover:bg-bodyoga-cream transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo slide"
            onClick={() => go(1)}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-bodyoga-cream/70 text-bodyoga-green hover:bg-bodyoga-cream transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para o slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-bodyoga-green" : "w-2.5 bg-bodyoga-green/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default BodyogaHeroSlider;
