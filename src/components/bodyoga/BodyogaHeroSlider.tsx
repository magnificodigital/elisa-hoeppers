import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listActiveSlides, type Slide } from "@/lib/shop";
import { isVideoUrl } from "@/lib/storage";
import heroBg from "@/assets/bodyoga/hero-combined-v3.jpg";
import { CouponCaptureDialog } from "@/components/bodyoga/CouponCaptureDialog";

/** The original, default hero — kept as the main (first) slide. */
function DefaultHero() {
  return (
    <>
      {/* MOBILE: imagem dos produtos com botão centralizado */}
      <div className="md:hidden relative min-h-[85vh] w-full bg-bodyoga-cream">
        <img
          src={heroBg}
          alt="Produtos BODYOGA"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          width={1200}
          height={1600}
        />
        <div className="absolute inset-0 pt-40 pb-24 flex items-center justify-center">
          <a
            href="#rituais"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("rituais")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-block px-7 py-3 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] transition"
          >
            Conhecer produtos
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
                <span className="whitespace-nowrap">Cuidado para corpo,</span>
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
                  Conhecer produtos
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
  if (!href) return;
  // Aliases comuns que apontam para a seção de produtos.
  const productAliases = ["#produtos", "#products", "#rituais", "#loja", "/produtos", "/loja"];
  if (productAliases.includes(href.toLowerCase())) {
    const target = document.getElementById("produtos") || document.getElementById("rituais");
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    }
    return;
  }
  if (href.startsWith("#")) {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }
}


/** Video slide — renders a background video (native mp4 file or YouTube embed) from a slide. */
function VideoSlide({ slide, onCouponClick }: { slide: Slide; onCouponClick?: () => void }) {
  const videoUrl = slide.video_url!;
  const isFile = isVideoUrl(videoUrl) || videoUrl.startsWith("/__l5e/");
  const capturesCoupon = slide.coupon_capture_enabled && !!onCouponClick;
  return (
    <>
      <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
        {isFile ? (
          <video
            key={videoUrl}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full w-auto h-auto object-cover"
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            suppressHydrationWarning
          >
            {/* 
              O elemento extra 'youtube-dubbing-button' injetado por extensões de navegador
              dentro da tag <video> causa erro de hidratação. O suppressHydrationWarning
              foi adicionado para mitigar isso.
            */}
          </video>
        ) : (
          <iframe
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full pointer-events-none"
            src={`${videoUrl}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&playlist=${videoUrl.split("/").pop()}`}
            title={slide.title}
            allow="autoplay; encrypted-media"
            frameBorder={0}
            data-tsd-ignore="true"
            suppressHydrationWarning
          />
        )}
        <div className="absolute inset-0 z-10" />
      </div>

      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      {slide.media_href && !capturesCoupon && (
        <a
          href={slide.media_href}
          onClick={(e) => handleAnchorClick(e, slide.media_href)}
          aria-label={slide.title || "Abrir"}
          className="absolute inset-0 z-[5]"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-24 md:h-32 bg-gradient-to-b from-transparent to-bodyoga-cream pointer-events-none" />

      <div className="relative z-10 max-w-[1170px] mx-auto px-4 md:px-6 pt-40 md:pt-56 pb-24 md:pb-36 flex items-center justify-center min-h-[85vh]">
        {slide.cta_label && (
          capturesCoupon ? (
            <button
              type="button"
              onClick={onCouponClick}
              className="px-7 py-3 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] transition"
            >
              {slide.cta_label}
            </button>
          ) : (
            <a
              href={slide.cta_href || "/agendar"}
              onClick={(e) => handleAnchorClick(e, slide.cta_href)}
              className="px-7 py-3 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] transition"
            >
              {slide.cta_label}
            </a>
          )
        )}
      </div>
    </>
  );
}


function CustomSlide({ slide, onCouponClick }: { slide: Slide; onCouponClick?: () => void }) {
  const titleLines = (slide.title || "").split("\n");
  const subtitleLines = (slide.subtitle ?? "").split("\n").filter(Boolean);
  const capturesCoupon = slide.coupon_capture_enabled && !!onCouponClick;
  return (
    <>
      {slide.media_href && !capturesCoupon && (
        <a
          href={slide.media_href}
          onClick={(e) => handleAnchorClick(e, slide.media_href)}
          aria-label={slide.title || "Abrir"}
          className="absolute inset-0 z-[5]"
        />
      )}
      {/* MOBILE */}
      <div className="md:hidden relative min-h-[85vh] w-full bg-bodyoga-cream">
        <h1 className="sr-only">{slide.title}</h1>
        {slide.image_url && (
          <img
            src={slide.image_url}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
            width={1200}
            height={1600}
          />
        )}
        {slide.cta_label && (
          <div className="absolute inset-0 pt-40 pb-24 flex items-center justify-center">
            {capturesCoupon ? (
              <button
                type="button"
                onClick={onCouponClick}
                className="inline-block px-7 py-3 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] transition"
              >
                {slide.cta_label}
              </button>
            ) : (
              <a
                href={slide.cta_href || "#rituais"}
                onClick={(e) => handleAnchorClick(e, slide.cta_href || "#rituais")}
                className="inline-block px-7 py-3 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm font-medium uppercase tracking-[0.18em] transition"
              >
                {slide.cta_label}
              </a>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        {slide.image_url && (
          <div
            className="absolute inset-0 bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${slide.image_url})`, backgroundPosition: "right center", backgroundSize: "contain" }}
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
                  {capturesCoupon ? (
                    <button
                      type="button"
                      onClick={onCouponClick}
                      className="px-7 py-3 rounded-full border border-bodyoga-green text-bodyoga-green text-sm font-medium uppercase tracking-[0.18em] hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
                    >
                      {slide.cta_label}
                    </button>
                  ) : (
                    <a
                      href={slide.cta_href || "#rituais"}
                      onClick={(e) => handleAnchorClick(e, slide.cta_href || "#rituais")}
                      className="px-7 py-3 rounded-full border border-bodyoga-green text-bodyoga-green text-sm font-medium uppercase tracking-[0.18em] hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
                    >
                      {slide.cta_label}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


export function BodyogaHeroSlider({ initialSlides }: { initialSlides?: Slide[] } = {}) {
  const [index, setIndex] = useState(0);
  const [couponOpen, setCouponOpen] = useState(false);
  const { data: slides, isPending } = useQuery({
    queryKey: ["bodyoga-slides-active"],
    queryFn: listActiveSlides,
    initialData: initialSlides,
    enabled: !initialSlides || initialSlides.length === 0,
  });

  const dbSlides = slides ?? [];
  const openCoupon = () => setCouponOpen(true);
  const items: ReactNode[] =
    !isPending && dbSlides.length > 0
      ? dbSlides.map((s) =>
          s.video_url
            ? <VideoSlide key={s.id} slide={s} onCouponClick={openCoupon} />
            : <CustomSlide key={s.id} slide={s} onCouponClick={openCoupon} />,
        )
      : isPending
        ? []
      : [<DefaultHero key="default" />];
  // Per-slide durations (seconds) parallel to items.
  const durations: number[] =
    dbSlides.length > 0
      ? dbSlides.map((s) => s.duration_seconds ?? 7)
      : [7];
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

  // Botões de navegação só aparecem se o slide atual permitir (padrão: sim).
  const showNav = count > 1 && (dbSlides[index]?.show_nav ?? true);

  if (isPending) {
    return (
      <section className="relative overflow-hidden bg-bodyoga-cream -mt-24 pt-24">
        <div className="min-h-[85vh]" />
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-bodyoga-cream -mt-24 pt-24">
      <div className="relative">
        {items[index]}

        {showNav && (
          <>
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={() => go(-1)}
              className="absolute left-3 md:left-6 top-[calc(50%+32px)] md:top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-bodyoga-cream/70 text-bodyoga-green hover:bg-bodyoga-cream transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={() => go(1)}
              className="absolute right-3 md:right-6 top-[calc(50%+32px)] md:top-1/2 -translate-y-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-bodyoga-cream/70 text-bodyoga-green hover:bg-bodyoga-cream transition"
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
      </div>
      <CouponCaptureDialog open={couponOpen} onClose={() => setCouponOpen(false)} />
    </section>
  );
}

export default BodyogaHeroSlider;
