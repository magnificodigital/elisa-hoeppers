import { useEffect, useRef, useState } from "react";
import { isVideoUrl } from "@/lib/storage";

export function GaleriaProduto({ images, alt }: { images: string[]; alt: string }) {
  const imgs = (images ?? []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  // respeita "reduzir movimento"
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (imgs.length <= 1 || paused || reduceMotion) return;
    timer.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % imgs.length);
    }, 4000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [imgs.length, paused, reduceMotion]);

  if (imgs.length === 0) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-[var(--surface-muted,#eee)]" />
    );
  }

  return (
    <div className="w-full">
      {/* Palco com crossfade */}
      <div
        className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[var(--surface-muted,#f3f0e9)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {imgs.map((src, i) => {
          const isVideo = isVideoUrl(src);
          return (
            <div
              key={src}
              className="absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === idx ? 1 : 0, zIndex: i === idx ? 1 : 0 }}
            >
              {isVideo ? (
                <video
                  src={src}
                  className="h-full w-full object-cover"
                  controls={i === idx}
                  muted
                  playsInline
                  autoPlay={i === idx}
                  loop
                />
              ) : (
                <img
                  src={src}
                  alt={`${alt} — imagem ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          );
        })}

        {/* Indicadores (dots) */}
        {imgs.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver imagem ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === idx ? "w-6 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {imgs.length > 1 && (
        <div className="mt-3 flex gap-2">
          {imgs.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition ${
                i === idx
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {isVideoUrl(src) ? (
                <video src={src} className="h-full w-full object-cover" muted />
              ) : (
                <img
                  src={src}
                  alt={`miniatura ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
