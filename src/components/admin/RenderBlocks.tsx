import React from "react";
import BodyogaHeroSlider from "../bodyoga/BodyogaHeroSlider";
import HomeInstagram from "../home/HomeInstagram";
import { useQuery } from "@tanstack/react-query";
import { listProducts, formatPriceBRL, type Product } from "@/lib/shop";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

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
                  {block.props.title && <h2 className="text-3xl md:text-4xl font-light mb-6 text-primary">{block.props.title}</h2>}
                  {block.props.content && <p className="text-lg text-primary/80 whitespace-pre-wrap leading-relaxed">{block.props.content}</p>}
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
              <section key={block.id} className={`py-20 px-4 text-center ${block.props.bgColor === 'primary' ? 'bg-primary text-white' : 'bg-cream text-primary'}`}>
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-display mb-4">{block.props.title}</h2>
                  {block.props.text && <p className="mb-8 opacity-80">{block.props.text}</p>}
                  {block.props.buttonLabel && (
                    <a href={block.props.buttonHref} className={`inline-block px-8 py-3 rounded-full uppercase tracking-widest text-xs font-bold transition ${block.props.bgColor === 'primary' ? 'bg-white text-primary hover:bg-cream' : 'bg-primary text-white hover:bg-primary-dark'}`}>
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
        {props.title && <h2 className="text-3xl font-display text-primary text-center mb-12">{props.title}</h2>}
        <div className={`grid grid-cols-1 md:grid-cols-${props.columns || 3} gap-8`}>
          {displayProducts?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const image = product.gallery?.[0]?.url || "";

  return (
    <div className="group flex flex-col items-center text-center">
      <a href={`/produto/${product.slug}`} className="block w-full mb-4 overflow-hidden rounded-2xl aspect-square bg-cream">
        <img 
          src={image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </a>
      <h3 className="text-lg font-medium text-primary-dark mb-1">{product.name}</h3>
      <p className="text-sm text-primary/60 mb-3">{formatPriceBRL(product.price_cents)}</p>
      <button
        onClick={() => {
          addItem({
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            image: image,
            unit_price_cents: product.price_cents
          });
          toast.success("Adicionado ao carrinho");
        }}
        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition opacity-0 group-hover:opacity-100"
      >
        <ShoppingCart size={14} /> Comprar
      </button>

    </div>
  );
}
