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
          case "instagram":
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

          case "spacer":
            return <div key={block.id} style={{ height: `${block.props.height}px` }} />;
          
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