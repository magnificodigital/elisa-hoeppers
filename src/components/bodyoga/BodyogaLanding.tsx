import { Link } from "@tanstack/react-router";
import { 
  ArrowRight, 
  Leaf, 
  Sparkles, 
  Wind, 
  Heart,
  ShoppingCart
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { listProducts, formatPriceBRL, type Product } from "@/lib/shop";
import { GaleriaProduto } from "../produto/GaleriaProduto";
import { BodyogaProductCard } from "./BodyogaProductCard";
import BodyogaHeroSlider from "./BodyogaHeroSlider";

const BodyogaLanding = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products-landing"],
    queryFn: () => listProducts()
  });

  const featured = products?.filter(p => p.is_featured).slice(0, 3) || [];

  return (
    <div className="bg-bodyoga-cream min-h-screen">
      <BodyogaHeroSlider />
      
      {/* Products Section */}
      <section id="produtos" className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl text-bodyoga-green mb-16">
            Nossos Produtos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="aspect-square bg-bodyoga-green/5 rounded-2xl animate-pulse" />
              ))
            ) : (
              featured.map(product => (
                <BodyogaProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          
          <div className="mt-16">
            <Link 
              to="/loja"
              className="inline-flex items-center gap-2 border border-bodyoga-green text-bodyoga-green px-8 py-3 rounded-full uppercase tracking-widest text-xs font-bold hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
            >
              Ver todos os produtos <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-bodyoga-green text-bodyoga-cream px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-bodyoga-cream/20 flex items-center justify-center mb-6">
              <Leaf className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl mb-4">100% Natural</h3>
            <p className="text-bodyoga-cream/70 leading-relaxed">
              Fórmulas limpas, sem conservantes sintéticos ou fragrâncias artificiais.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-bodyoga-cream/20 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl mb-4">Artesanal</h3>
            <p className="text-bodyoga-cream/70 leading-relaxed">
              Produzido em pequenos lotes para garantir o frescor e a energia vital.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-bodyoga-cream/20 flex items-center justify-center mb-6">
              <Wind className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl mb-4">Aromaterapia</h3>
            <p className="text-bodyoga-cream/70 leading-relaxed">
              Benefícios terapêuticos através de óleos essenciais puros.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BodyogaLanding;
