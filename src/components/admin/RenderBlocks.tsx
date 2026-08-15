import React from "react";
import BodyogaHeroSlider from "../bodyoga/BodyogaHeroSlider";
import { BodyogaProductCard } from "../bodyoga/BodyogaLanding";
import HomeInstagram from "../home/HomeInstagram";
import HomeBlog from "../home/HomeBlog";
import { listActiveSlides, listProducts, formatPriceBRL } from "@/lib/shop";
import { listPublishedCourses } from "@/lib/courses";
import { useQuery } from "@tanstack/react-query";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Leaf, 
  Heart, 
  Sparkles, 
  Flower2, 
  Sprout, 
  Clock, 
  Layout, 
  Star,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import iconAsset from "@/assets/bodyoga/icone-bodyoga-2.png.asset.json";

interface RenderBlocksProps {
  blocks: any[];
}

export const RenderBlocks: React.FC<RenderBlocksProps> = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <div className="flex flex-col w-full">
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return (
              <BodyogaHeroSlider 
                key={block.id}
                initialSlides={[{
                  id: block.id,
                  title: block.props.title,
                  subtitle: block.props.subtitle,
                  button_label: block.props.buttonLabel,
                  button_link: block.props.buttonHref,
                  image_url: block.props.bgImage,
                  video_url: block.props.bgVideo,
                  overlay_opacity: block.props.overlay,
                  active: true
                } as any]}
              />
            );
          case "text":
            return (
              <section key={block.id} className="py-16 px-4 max-w-4xl mx-auto w-full">
                <div className={`text-${block.props.align || 'left'}`}>
                  {block.props.title && <h2 className="text-3xl md:text-4xl font-light mb-6 text-primary">{block.props.title}</h2>}
                  {block.props.content && <p className="text-lg text-primary/80 whitespace-pre-wrap">{block.props.content}</p>}
                </div>
              </section>
            );
          case "products":
            return (
              <HomeRitualsBlock 
                key={block.id} 
                columns={block.props.columns} 
                title={block.props.title}
                selection={block.props.selection}
              />
            );

          case "image-text": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream overflow-hidden">
                <div className="max-w-[1170px] mx-auto px-6 md:px-10 py-16 md:py-24">
                  <div className={`grid md:grid-cols-2 gap-10 lg:gap-16 items-center ${p.side === 'left' ? 'md:[&>*:first-child]:order-2' : ''}`}>
                    {p.image && (
                      <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-bodyoga-green/5">
                        <img src={p.image} alt={p.title || ''} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="space-y-6">
                      {p.title && <h2 className="font-display text-3xl md:text-4xl text-bodyoga-green leading-tight">{p.title}</h2>}
                      {p.content && <p className="text-lg text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line">{p.content}</p>}
                      {p.buttonLabel && (
                        <a href={p.buttonHref || '#'} className="inline-flex px-7 py-4 rounded-full border border-bodyoga-green/20 hover:bg-bodyoga-green hover:text-bodyoga-cream text-[11px] uppercase tracking-[0.3em] font-semibold transition">
                          {p.buttonLabel}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          case "categories": {
            const p = block.props;
            const cols = p.columns === 1 ? "grid-cols-1" : 
                         p.columns === 2 ? "grid-cols-2" : 
                         p.columns === 4 ? "grid-cols-2 lg:grid-cols-4" : 
                         "grid-cols-2 md:grid-cols-3";
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 px-4">
                <div className="max-w-[1170px] mx-auto">
                  <div className={`grid ${cols} gap-4 md:gap-6`}>
                    {(p.items || []).map((item: any, i: number) => (
                      <a key={i} href={item.link || '#'} className="group block relative aspect-square overflow-hidden rounded-2xl bg-bodyoga-green/5">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-display text-xl md:text-2xl tracking-wide">{item.name}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "gallery": {
            const p = block.props;
            const cols = p.columns === 1 ? "grid-cols-1" : 
                         p.columns === 2 ? "grid-cols-2" : 
                         p.columns === 4 ? "grid-cols-2 lg:grid-cols-4" : 
                         "grid-cols-2 md:grid-cols-3";
            return (
              <section key={block.id} className="bg-bodyoga-cream py-12 px-4">
                <div className="max-w-[1170px] mx-auto">
                  <div className={`grid ${cols} gap-4`}>
                    {(p.images || []).map((img: any, i: number) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-bodyoga-green/5">
                        <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "image": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream py-8 px-4 flex flex-col items-center">
                <div style={{ width: p.width || '100%', maxWidth: '100%' }} className="rounded-2xl overflow-hidden">
                  <img src={p.url} alt={p.caption || ''} className="w-full h-auto" />
                </div>
                {p.caption && <p className="mt-4 text-sm text-bodyoga-green/60 italic">{p.caption}</p>}
              </section>
            );
          }

          case "video": {
            const p = block.props;
            const ratio = p.ratio === '21/9' ? 'aspect-[21/9]' : p.ratio === '4/3' ? 'aspect-[4/3]' : 'aspect-video';
            return (
              <section key={block.id} className="bg-bodyoga-cream py-12 px-4">
                <div className={`max-w-[1170px] mx-auto rounded-2xl overflow-hidden shadow-xl ${ratio} bg-black`}>
                  {p.url.includes('youtube.com') || p.url.includes('youtu.be') ? (
                    <iframe src={p.url.replace('watch?v=', 'embed/')} className="w-full h-full" frameBorder="0" allowFullScreen />
                  ) : (
                    <video src={p.url} className="w-full h-full object-cover" autoPlay={p.autoplay} muted={p.autoplay} controls />
                  )}
                </div>
              </section>
            );
          }

          case "faq": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24 px-4">
                <div className="max-w-3xl mx-auto">
                  {p.title && <h2 className="font-display text-3xl text-bodyoga-green text-center mb-12">{p.title}</h2>}
                  <Accordion type="single" collapsible className="w-full">
                    {(p.items || []).map((item: any, i: number) => (
                      <AccordionItem key={i} value={`item-${i}`} className="border-bodyoga-green/10">
                        <AccordionTrigger className="font-display text-lg text-bodyoga-green hover:text-bodyoga-green/80">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-bodyoga-green/70 leading-relaxed">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </section>
            );
          }

          case "testimonials": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24 overflow-hidden">
                <div className="max-w-[1170px] mx-auto px-4">
                  <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    {(p.items || []).map((t: any, i: number) => (
                      <div key={i} className="max-w-xs flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-bodyoga-green/10 mb-6">
                          {t.photo && <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />}
                        </div>
                        <p className="text-bodyoga-green/80 italic font-light mb-4">"{t.text}"</p>
                        <span className="font-display text-bodyoga-green tracking-wide">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          case "stats": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-green py-16 md:py-20 text-bodyoga-cream">
                <div className="max-w-[1170px] mx-auto px-4 flex flex-wrap justify-around gap-8">
                  {(p.items || []).map((s: any, i: number) => (
                    <div key={i} className="flex flex-col items-center text-center min-w-[150px]">
                      <span className="font-display text-4xl md:text-5xl mb-2">{s.value}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">{s.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case "benefits": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24">
                <div className="max-w-[1170px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
                  {(p.items || []).map((b: any, i: number) => (
                    <div key={i} className="flex flex-col items-center text-center space-y-4">
                      <div className="text-bodyoga-green">
                        <IconSelector icon={b.icon} className="w-8 h-8" />
                      </div>
                      <h3 className="font-display text-xl text-bodyoga-green">{b.title}</h3>
                      <p className="text-bodyoga-green/70 text-sm leading-relaxed">{b.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case "timeline": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24 px-4">
                <div className="max-w-3xl mx-auto relative border-l border-bodyoga-green/20 pl-8 space-y-12">
                  {(p.items || []).map((t: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full bg-bodyoga-green border-4 border-bodyoga-cream" />
                      <span className="font-display text-2xl text-bodyoga-green block mb-2">{t.year}</span>
                      <h3 className="text-lg font-medium text-bodyoga-green mb-2">{t.title}</h3>
                      <p className="text-bodyoga-green/70 leading-relaxed">{t.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          case "author": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24">
                <div className="max-w-[900px] mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
                  <div className="md:col-span-5 aspect-[4/5] rounded-2xl overflow-hidden bg-bodyoga-green/5">
                    {p.photo && <img src={p.photo} alt={p.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="md:col-span-7 space-y-6">
                    <h2 className="font-display text-3xl text-bodyoga-green">{p.title}</h2>
                    <p className="text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line">{p.bio}</p>
                    {p.signature && <img src={p.signature} alt="Assinatura" className="h-16 w-auto opacity-70" />}
                  </div>
                </div>
              </section>
            );
          }

          case "courses":
            return <CoursesBlock key={block.id} columns={block.props.columns} />;

          case "cta": {
            const p = block.props;
            const isPrimary = p.bgColor === 'primary';
            return (
              <section key={block.id} className={`${isPrimary ? 'bg-bodyoga-green text-bodyoga-cream' : 'bg-bodyoga-cream text-bodyoga-green'} py-16 md:py-24 px-4 text-center`}>
                <div className="max-w-2xl mx-auto space-y-8">
                  <h2 className="font-display text-3xl md:text-5xl leading-tight">{p.title}</h2>
                  {p.text && <p className="text-lg opacity-80">{p.text}</p>}
                  <a href={p.buttonHref || '#'} className={`inline-flex px-10 py-4 rounded-full border text-[11px] uppercase tracking-[0.3em] font-semibold transition ${
                    isPrimary ? 'border-bodyoga-cream/20 hover:bg-bodyoga-cream hover:text-bodyoga-green' : 'border-bodyoga-green/20 hover:bg-bodyoga-green hover:text-bodyoga-cream'
                  }`}>
                    {p.buttonLabel}
                  </a>
                </div>
              </section>
            );
          }

          case "newsletter": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-green py-20 px-4 text-bodyoga-cream text-center">
                <div className="max-w-xl mx-auto space-y-8">
                  <h2 className="font-display text-3xl md:text-4xl">{p.title}</h2>
                  <p className="opacity-80">{p.text}</p>
                  <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => {
                    e.preventDefault();
                    toast.success("Inscrito com sucesso!");
                  }}>
                    <input 
                      type="email" 
                      placeholder="Seu melhor email" 
                      className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                      required
                    />
                    <button className="bg-bodyoga-cream text-bodyoga-green px-8 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:opacity-90 transition">
                      Enviar
                    </button>
                  </form>
                </div>
              </section>
            );
          }

          case "custom-projects": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 md:py-24 border-y border-bodyoga-green/5">
                <div className="max-w-[1170px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="max-w-xl text-center md:text-left">
                    <h2 className="font-display text-3xl md:text-4xl text-bodyoga-green mb-4">{p.title}</h2>
                    <p className="text-bodyoga-green/70">{p.text}</p>
                  </div>
                  <Link to="/projetos-personalizados" className="inline-flex px-10 py-4 rounded-full border border-bodyoga-green/20 hover:bg-bodyoga-green hover:text-bodyoga-cream text-[11px] uppercase tracking-[0.3em] font-semibold transition text-bodyoga-green">
                    Solicitar Projeto
                  </Link>
                </div>
              </section>
            );
          }

          case "yoga-classes": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-green py-16 md:py-24 px-4 text-center text-bodyoga-cream">
                <div className="max-w-2xl mx-auto space-y-8">
                  <h2 className="font-display text-3xl md:text-5xl">{p.title}</h2>
                  <p className="text-lg opacity-80">{p.text}</p>
                  <Link to="/agende-sua-aula" className="inline-flex px-10 py-4 rounded-full border border-bodyoga-cream/20 hover:bg-bodyoga-cream hover:text-bodyoga-green text-[11px] uppercase tracking-[0.3em] font-semibold transition text-bodyoga-cream">
                    Agendar Aula
                  </Link>
                </div>
              </section>
            );
          }

          case "columns": {
            const p = block.props;
            const cols = p.count === 2 ? "grid-cols-1 md:grid-cols-2" : 
                         p.count === 3 ? "grid-cols-1 md:grid-cols-3" : 
                         "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
            return (
              <section key={block.id} className="bg-bodyoga-cream py-16 px-4">
                <div className={`max-w-[1170px] mx-auto grid ${cols} gap-12`}>
                  {(p.items || []).map((item: any, i: number) => (
                    <div key={i} className="text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: item.content }} />
                  ))}
                </div>
              </section>
            );
          }

          case "shortcut-banner": {
            const p = block.props;
            return (
              <section key={block.id} className="bg-bodyoga-cream py-12 px-4">
                <div className="max-w-[1170px] mx-auto rounded-2xl overflow-hidden relative min-h-[300px] flex items-center">
                  {p.image && <img src={p.image} className="absolute inset-0 w-full h-full object-cover" alt="" />}
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 p-8 md:p-16 space-y-8">
                    <h2 className="font-display text-3xl md:text-4xl text-white">{p.title}</h2>
                    <div className="flex flex-wrap gap-4">
                      {(p.shortcuts || []).map((s: any, i: number) => (
                        <a key={i} href={s.link || '#'} className="bg-white/90 hover:bg-white text-bodyoga-green px-6 py-2.5 rounded-full text-xs uppercase tracking-widest font-bold transition">
                          {s.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          case "spacer":
            return <div key={block.id} style={{ height: `${block.props.height}px` }} />;

          case "home-insta":
            return <HomeInstagram key={block.id} />;
          
          case "home-hero":
            return <HomeHeroBlock key={block.id} />;
            
          case "home-opening":
            return (
              <section key={block.id} className="bg-bodyoga-cream">
                <div className="max-w-[900px] mx-auto px-6 py-6 md:py-10 flex flex-col items-center text-center">
                  {block.props.icon && (
                    <img
                      src={block.props.icon}
                      alt="BODYOGA"
                      className="w-28 md:w-40 h-auto mb-3"
                      loading="lazy"
                    />
                  )}
                  <p className="font-display text-2xl md:text-4xl text-bodyoga-green leading-snug whitespace-pre-line">
                    {block.props.title}
                  </p>
                </div>
              </section>
            );

          case "home-rituals":
            return <HomeRitualsBlock key={block.id} />;

          case "home-intro":
            return (
              <section key={block.id} className="bg-bodyoga-cream overflow-hidden">
                <div className="max-w-[1170px] mx-auto px-6 md:px-10 py-20 md:py-32">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 items-center">
                    <div className="md:col-span-6 relative">
                      <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-bodyoga-green/5">
                        <img
                          src={block.props.image}
                          alt="Elisa Hoeppers"
                          className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-6 flex flex-col justify-center space-y-10 mt-12 md:mt-0">
                      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-bodyoga-green leading-[1.15]">
                        {renderIntroTitle(block.props.title || "")}
                      </h2>
                      <div className="space-y-6 max-w-md">
                        {block.props.p1 && (
                          <p className="text-lg md:text-xl text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line">
                            {block.props.p1}
                          </p>
                        )}
                        {block.props.p2 && (
                          <p className="text-sm md:text-base text-bodyoga-green font-medium leading-relaxed tracking-wide whitespace-pre-line">
                            {block.props.p2}
                          </p>
                        )}
                      </div>
                      {block.props.ctaLabel && (
                        <div>
                          <a
                            href={block.props.ctaHref || "#"}
                            className="group inline-flex items-center gap-2 px-7 py-4 rounded-full border border-bodyoga-green/20 hover:bg-bodyoga-green hover:border-bodyoga-green transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                          >
                            <span className="text-[11px] uppercase tracking-[0.3em] text-bodyoga-green group-hover:text-bodyoga-cream font-semibold transition-colors">
                              {block.props.ctaLabel}
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );

          case "home-blog":
            return <HomeBlog key={block.id} />;

          
          default:
            return (
              <div key={block.id} className="p-8 border border-dashed border-gray-300 text-center text-gray-500">
                Bloco "{block.type}" em desenvolvimento
              </div>
            );
        }
      })}
    </div>
  );
};

function HomeHeroBlock() {
  const { data: slides } = useQuery({ 
    queryKey: ["bodyoga-slides-active"], 
    queryFn: listActiveSlides 
  });
  return <BodyogaHeroSlider initialSlides={slides ?? []} />;
}

function HomeRitualsBlock({ columns = 3, title, selection = "all" }: { columns?: number, title?: string, selection?: string }) {
  const { data: products } = useQuery({ 
    queryKey: ["bodyoga-products", selection], 
    queryFn: () => listProducts({ 
      onlyInStock: false,
      featured: selection === "featured"
    }) 
  });
  
  const gridCols = columns === 1 ? "grid-cols-1" : 
                   columns === 2 ? "grid-cols-1 md:grid-cols-2" : 
                   columns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
                   "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <section id="rituais" className="bg-bodyoga-cream scroll-mt-24">
      <span id="produtos" className="block -mt-24 pt-24" aria-hidden />
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-20">
        {title && (
          <h2 className="font-display text-3xl md:text-4xl text-bodyoga-green text-center mb-12">
            {title}
          </h2>
        )}
        <div className={`grid ${gridCols} gap-4 md:gap-8`}>
          {(products ?? []).map((p) => (
            <BodyogaProductCard key={p.slug} product={p} noBorder />
          ))}
        </div>
      </div>
    </section>
  );
}

function CoursesBlock({ columns = 2 }: { columns?: number }) {
  const { data: courses } = useQuery({
    queryKey: ["courses", "published"],
    queryFn: listPublishedCourses,
  });

  const gridCols = columns === 1 ? "grid-cols-1" : 
                   columns === 3 ? "grid-cols-1 md:grid-cols-3" :
                   "grid-cols-1 md:grid-cols-2";

  return (
    <section className="bg-bodyoga-cream py-16 md:py-24">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <div className={`grid ${gridCols} gap-8`}>
          {(courses ?? []).map((c) => (
            <Link
              key={c.id}
              to="/cursos/$slug"
              params={{ slug: c.slug }}
              className="flex flex-col group"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-bodyoga-green/5">
                {c.cover_image && (
                  <img
                    src={c.cover_image}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                )}
                {c.overlay_label && (
                  <span className="absolute top-4 left-4 bg-bodyoga-cream/90 text-bodyoga-green text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {c.overlay_label}
                  </span>
                )}
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-display text-xl text-bodyoga-green">{c.title}</h3>
                {c.subtitle && (
                  <p className="text-bodyoga-green/60 text-sm mt-2">{c.subtitle}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconSelector({ icon, className }: { icon: string, className?: string }) {
  switch (icon) {
    case 'leaf': return <Leaf className={className} />;
    case 'heart': return <Heart className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    case 'flower': return <Flower2 className={className} />;
    case 'sprout': return <Sprout className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'layout': return <Layout className={className} />;
    case 'star': return <Star className={className} />;
    default: return <CheckCircle2 className={className} />;
  }
}


function renderIntroTitle(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line.split(/(\*[^*]+\*)/g).map((part, j) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <span key={j} className="italic">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        )
      )}
    </span>
  ));
}