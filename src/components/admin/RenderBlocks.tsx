import React from "react";
import BodyogaHeroSlider from "../bodyoga/BodyogaHeroSlider";
import HomeInstagram from "../home/HomeInstagram";
import { useQuery } from "@tanstack/react-query";
import { listProducts, formatPriceBRL, type Product } from "@/lib/shop";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { BodyogaProductCard } from "../bodyoga/BodyogaProductCard";

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
                  cta_label: block.props.buttonLabel,
                  cta_href: block.props.buttonHref,
                  image_url: block.props.bgImage,
                  video_url: block.props.bgVideo,
                  media_href: block.props.mediaHref,
                  show_nav: block.props.showNav ?? true,
                  active: true
                } as any]}
              />
            );
          case "text":
            return (
              <section key={block.id} className="py-16 px-4 max-w-4xl mx-auto w-full">
                <div className={`text-${block.props.align || 'left'}`}>
                  {block.props.title && <h2 className="text-3xl md:text-4xl font-display mb-6 text-bodyoga-green">{block.props.title}</h2>}
                  {block.props.content && <p className="text-lg text-bodyoga-green/80 whitespace-pre-wrap leading-relaxed">{block.props.content}</p>}
                </div>
              </section>
            );
          case "products":
            return <ProductsBlock key={block.id} props={block.props} />;
          case "instagram":
            return <HomeInstagram key={block.id} />;
          case "spacer":
            return <div key={block.id} style={{ height: `${block.props.height}px` }} />;
          case "cta":
            return (
              <section key={block.id} className={`py-20 px-4 text-center ${block.props.bgColor === 'primary' ? 'bg-bodyoga-green text-bodyoga-cream' : 'bg-bodyoga-cream text-bodyoga-green'}`}>
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-display mb-4">{block.props.title}</h2>
                  {block.props.text && <p className="mb-8 opacity-80">{block.props.text}</p>}
                  {block.props.buttonLabel && (
                    <a href={block.props.buttonHref} className={`inline-block px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[10px] font-bold transition shadow-sm ${block.props.bgColor === 'primary' ? 'bg-bodyoga-cream text-bodyoga-green hover:bg-white' : 'bg-bodyoga-green text-bodyoga-cream hover:bg-bodyoga-green/90'}`}>
                      {block.props.buttonLabel}
                    </a>
                  )}
                </div>
              </section>
            );
          default:
            return (
              <div key={block.id} className="p-8 border border-dashed border-gray-300 text-center text-gray-500 bg-gray-50 my-4 rounded-lg">
                Bloco "{block.type}" em desenvolvimento
              </div>
            );
        }
      })}
    </div>
  );
};

function ProductsBlock({ props }: { props: any }) {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products-block"],
    queryFn: () => listProducts()
  });

  if (isLoading) return <div className="py-20 text-center text-primary/40">Carregando produtos...</div>;

  const displayProducts = props.selection === 'featured' 
    ? products?.filter(p => p.is_featured).slice(0, props.columns * 2)
    : products?.slice(0, props.columns * 2);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {props.title && <h2 className="text-3xl font-display text-bodyoga-green text-center mb-12">{props.title}</h2>}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${props.columns || 3} gap-8 md:gap-10`}>
          {displayProducts?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  return <BodyogaProductCard product={product} />;
}
