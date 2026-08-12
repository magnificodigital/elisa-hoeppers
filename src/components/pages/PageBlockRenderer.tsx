import { MarkdownContent } from "@/components/MarkdownContent";
import type { PageBlock, BlockStyle } from "@/lib/page-blocks";

const BG: Record<string, string> = {
  transparent: "",
  cream: "bg-cream",
  white: "bg-white",
  sand: "bg-sand",
  primary: "bg-primary text-white",
};

const PAD: Record<string, string> = {
  none: "py-0",
  sm: "py-3 md:py-4",
  md: "py-8 md:py-12",
  lg: "py-14 md:py-20",
};

const WIDTH: Record<string, string> = {
  narrow: "max-w-[640px]",
  normal: "max-w-[860px]",
  wide: "max-w-[1160px]",
  full: "max-w-none",
};

const ALIGN: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };

function Section({ style, children }: { style?: BlockStyle; children: React.ReactNode }) {
  const bg = BG[style?.bg ?? "transparent"] ?? "";
  const pad = PAD[style?.pad ?? "md"] ?? PAD.md;
  const width = WIDTH[style?.width ?? "normal"] ?? WIDTH.normal;
  return (
    <section className={`${bg} ${pad}`}>
      <div className={`${width} mx-auto px-4 md:px-6`}>{children}</div>
    </section>
  );
}

function youtubeId(url: string): string | null {
  const m = /(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/.exec(url ?? "");
  return m ? m[1] : null;
}

function Btn({
  label,
  href,
  variant = "solid",
}: {
  label: string;
  href: string;
  variant?: string;
}) {
  const base = "inline-flex items-center justify-center px-7 py-3 rounded-full text-xs uppercase tracking-widest transition";
  const cls =
    variant === "outline"
      ? `${base} border border-current text-primary hover:bg-primary hover:text-white`
      : variant === "link"
        ? "inline-flex items-center text-sm underline text-primary"
        : `${base} bg-primary text-white hover:bg-primary-dark`;
  return (
    <a href={href || "#"} className={cls}>
      {label}
    </a>
  );
}

export function PageBlockView({ block }: { block: PageBlock }) {
  const p = block.props ?? {};

  switch (block.type) {
    case "heading": {
      const sizes: Record<number, string> = {
        1: "text-4xl md:text-6xl",
        2: "text-3xl md:text-4xl",
        3: "text-2xl md:text-3xl",
        4: "text-xl md:text-2xl",
      };
      const Tag = `h${p.level ?? 2}` as "h1" | "h2" | "h3" | "h4";
      return (
        <Section style={block.style}>
          <Tag className={`font-display text-primary-dark ${sizes[p.level ?? 2] ?? sizes[2]} ${ALIGN[p.align ?? "left"]}`}>
            {p.text}
          </Tag>
        </Section>
      );
    }
    case "text":
      return (
        <Section style={block.style}>
          <div className={ALIGN[p.align ?? "left"]}>
            <MarkdownContent content={p.content ?? ""} />
          </div>
        </Section>
      );
    case "list":
      return (
        <Section style={block.style}>
          {p.ordered ? (
            <ol className="list-decimal pl-5 space-y-2 text-primary-dark/80">
              {(p.items ?? []).map((it: string, i: number) => (
                <li key={i}>{it}</li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc pl-5 space-y-2 text-primary-dark/80">
              {(p.items ?? []).map((it: string, i: number) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          )}
        </Section>
      );
    case "quote":
      return (
        <Section style={block.style}>
          <blockquote className="border-l-2 border-primary pl-5 md:pl-6">
            <p className="font-display text-xl md:text-2xl text-primary-dark leading-relaxed">{p.text}</p>
            {p.author && <footer className="text-sm text-primary-dark/60 mt-2">— {p.author}</footer>}
          </blockquote>
        </Section>
      );
    case "image":
      return (
        <Section style={block.style}>
          {p.url ? (
            <figure>
              <img
                src={p.url}
                alt={p.alt ?? ""}
                loading="lazy"
                className={`w-full h-auto ${p.rounded ? "rounded-2xl" : ""}`}
              />
              {p.caption && <figcaption className="text-xs text-primary-dark/50 mt-2 text-center">{p.caption}</figcaption>}
            </figure>
          ) : null}
        </Section>
      );
    case "gallery": {
      const cols = Number(p.columns ?? 3);
      const grid = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3";
      return (
        <Section style={block.style}>
          <div className={`grid gap-3 ${grid}`}>
            {(p.images ?? []).map((src: string, i: number) => (
              <img key={i} src={src} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-xl" />
            ))}
          </div>
        </Section>
      );
    }
    case "video": {
      const yt = youtubeId(p.url ?? "");
      return (
        <Section style={block.style}>
          <div className="rounded-2xl overflow-hidden bg-primary-dark/5">
            {yt ? (
              <iframe
                src={`https://www.youtube.com/embed/${yt}`}
                title={p.caption || "Vídeo"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video"
              />
            ) : p.url ? (
              <video src={p.url} controls playsInline className="w-full" />
            ) : null}
          </div>
          {p.caption && <p className="text-xs text-primary-dark/50 mt-2 text-center">{p.caption}</p>}
        </Section>
      );
    }
    case "button":
      return (
        <Section style={block.style}>
          <div className={ALIGN[p.align ?? "center"]}>
            <Btn label={p.label} href={p.href} variant={p.variant} />
          </div>
        </Section>
      );
    case "buttons":
      return (
        <Section style={block.style}>
          <div
            className={`flex flex-wrap gap-3 ${
              p.align === "left" ? "justify-start" : p.align === "right" ? "justify-end" : "justify-center"
            }`}
          >
            {(p.items ?? []).map((b: any, i: number) => (
              <Btn key={i} label={b.label} href={b.href} variant={b.variant} />
            ))}
          </div>
        </Section>
      );
    case "spacer":
      return <div style={{ height: Number(p.size ?? 48) }} />;
    case "divider":
      return (
        <Section style={block.style}>
          <hr className="border-border" />
        </Section>
      );
    case "columns": {
      const imgFirst = p.imageSide === "left";
      return (
        <Section style={{ width: "wide", ...block.style }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {p.image && (
              <img
                src={p.image}
                alt={p.title ?? ""}
                loading="lazy"
                className={`w-full h-full object-cover rounded-2xl max-h-[520px] ${imgFirst ? "md:order-1" : "md:order-2"}`}
              />
            )}
            <div className={imgFirst ? "md:order-2" : "md:order-1"}>
              {p.title && <h2 className="font-display text-2xl md:text-4xl text-primary-dark mb-4">{p.title}</h2>}
              <MarkdownContent content={p.content ?? ""} />
              {p.buttonLabel && (
                <div className="mt-6">
                  <Btn label={p.buttonLabel} href={p.buttonHref} />
                </div>
              )}
            </div>
          </div>
        </Section>
      );
    }
    case "features": {
      const cols = Number(p.columns ?? 3);
      const grid = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
      return (
        <Section style={{ width: "wide", ...block.style }}>
          {p.title && <h2 className="font-display text-2xl md:text-4xl text-primary-dark text-center mb-10">{p.title}</h2>}
          <div className={`grid gap-6 ${grid}`}>
            {(p.items ?? []).map((it: any, i: number) => (
              <div key={i} className="text-center px-4">
                {it.image && <img src={it.image} alt="" loading="lazy" className="w-16 h-16 object-contain mx-auto mb-4" />}
                <h3 className="font-display text-lg text-primary-dark mb-2">{it.title}</h3>
                <p className="text-sm text-primary-dark/70 leading-relaxed">{it.text}</p>
              </div>
            ))}
          </div>
        </Section>
      );
    }
    case "cards": {
      const cols = Number(p.columns ?? 3);
      const grid = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
      return (
        <Section style={{ width: "wide", ...block.style }}>
          {p.title && <h2 className="font-display text-2xl md:text-4xl text-primary-dark text-center mb-10">{p.title}</h2>}
          <div className={`grid gap-5 ${grid}`}>
            {(p.items ?? []).map((it: any, i: number) => {
              const inner = (
                <>
                  {it.image && <img src={it.image} alt={it.title ?? ""} loading="lazy" className="w-full aspect-[4/3] object-cover rounded-xl mb-3" />}
                  <h3 className="font-display text-lg text-primary-dark">{it.title}</h3>
                  {it.text && <p className="text-sm text-primary-dark/70 mt-1">{it.text}</p>}
                </>
              );
              return it.href ? (
                <a key={i} href={it.href} className="block group">
                  {inner}
                </a>
              ) : (
                <div key={i}>{inner}</div>
              );
            })}
          </div>
        </Section>
      );
    }
    case "faq":
      return (
        <Section style={block.style}>
          {p.title && <h2 className="font-display text-2xl md:text-4xl text-primary-dark mb-8">{p.title}</h2>}
          <div className="divide-y divide-border border-y border-border">
            {(p.items ?? []).map((it: any, i: number) => (
              <details key={i} className="py-4 group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-primary-dark font-medium">
                  {it.q}
                  <span className="text-primary transition group-open:rotate-45">+</span>
                </summary>
                <div className="mt-3 text-sm text-primary-dark/70 leading-relaxed">
                  <MarkdownContent content={it.a ?? ""} />
                </div>
              </details>
            ))}
          </div>
        </Section>
      );
    case "stats":
      return (
        <Section style={{ width: "wide", ...block.style }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {(p.items ?? []).map((it: any, i: number) => (
              <div key={i}>
                <p className="font-display text-3xl md:text-5xl text-primary">{it.value}</p>
                <p className="text-xs uppercase tracking-widest text-primary-dark/60 mt-2">{it.label}</p>
              </div>
            ))}
          </div>
        </Section>
      );
    case "testimonial":
      return (
        <Section style={block.style}>
          <div className="text-center max-w-[640px] mx-auto">
            {p.avatar && <img src={p.avatar} alt={p.author ?? ""} loading="lazy" className="w-16 h-16 rounded-full object-cover mx-auto mb-4" />}
            <p className="font-display text-xl md:text-2xl text-primary-dark leading-relaxed">“{p.text}”</p>
            <p className="text-sm text-primary-dark/60 mt-4">
              {p.author}
              {p.role ? ` · ${p.role}` : ""}
            </p>
          </div>
        </Section>
      );
    case "hero": {
      const h = p.height === "small" ? "h-[32vh]" : p.height === "large" ? "h-[70vh]" : "h-[48vh]";
      return (
        <section className={`relative ${h} min-h-[240px] overflow-hidden bg-primary-dark`}>
          {p.image && <img src={p.image} alt={p.title ?? ""} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-primary-dark/40" />
          <div
            className={`relative h-full flex flex-col justify-center px-6 max-w-[1160px] mx-auto ${
              p.align === "left" ? "items-start text-left" : p.align === "right" ? "items-end text-right" : "items-center text-center"
            }`}
          >
            {p.title && <h1 className="font-display text-3xl md:text-5xl text-white">{p.title}</h1>}
            {p.subtitle && <p className="text-white/85 mt-3 max-w-xl">{p.subtitle}</p>}
            {p.buttonLabel && (
              <a
                href={p.buttonHref || "#"}
                className="mt-6 inline-flex items-center px-7 py-3 rounded-full bg-primary text-white text-xs uppercase tracking-widest"
              >
                {p.buttonLabel}
              </a>
            )}
          </div>
        </section>
      );
    }
    case "cta":
      return (
        <Section style={block.style}>
          <div className="text-center">
            <h2 className="font-display text-2xl md:text-4xl">{p.title}</h2>
            {p.text && <p className="mt-3 opacity-85">{p.text}</p>}
            {p.buttonLabel && (
              <a
                href={p.buttonHref || "#"}
                className="mt-6 inline-flex items-center px-7 py-3 rounded-full bg-cream text-primary-dark text-xs uppercase tracking-widest"
              >
                {p.buttonLabel}
              </a>
            )}
          </div>
        </Section>
      );
    case "html":
      return (
        <Section style={block.style}>
          <div className="[&_iframe]:w-full [&_iframe]:rounded-xl" dangerouslySetInnerHTML={{ __html: p.code ?? "" }} />
        </Section>
      );
    default:
      return null;
  }
}

export function PageBlocksRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {(blocks ?? []).map((b) => (
        <PageBlockView key={b.id} block={b} />
      ))}
    </>
  );
}

export default PageBlocksRenderer;
