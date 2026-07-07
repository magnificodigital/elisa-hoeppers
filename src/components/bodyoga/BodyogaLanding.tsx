import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  Leaf,
  Sparkles,
  Flower2,
  Sprout,
  ArrowRight,
  HandHeart,
  Recycle,
  FlaskConical,
  PawPrint,
  Wind,
  PackageOpen,
} from "lucide-react";
import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import { BodyogaHeroSlider } from "@/components/bodyoga/BodyogaHeroSlider";
import Footer from "@/components/Footer";
import { BodyogaLogo } from "@/components/bodyoga/BodyogaLogo";
import HomeBlog from "@/components/home/HomeBlog";
import HomeInstagram from "@/components/home/HomeInstagram";
import { listProducts, listActiveRituals, formatPriceBRL, firstImage, type Product } from "@/lib/shop";




const aromas = [
  { name: "Lavanda", desc: "Acalma a mente, reduz o estresse, traz tranquilidade.", icon: Leaf },
  { name: "Mandarina Verde", desc: "Revitaliza, traz leveza e alegria.", icon: Sparkles },
  { name: "Patchouli", desc: "Aterra, traz profundidade e acolhimento.", icon: Sprout },
  { name: "Gerânio", desc: "Equilibra emoções, harmoniza corpo, mente e ambiente.", icon: Flower2 },
];

const beneficios = [
  { title: "Artesanal", desc: "Produzido à mão em pequenos lotes.", icon: HandHeart },
  { title: "Livre de tóxicos", desc: "Sem parabenos, sulfatos ou fragrâncias artificiais.", icon: Wind },
  { title: "Fresquinho", desc: "Feito sob demanda, sempre recém-produzido.", icon: PackageOpen },
];

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

export function BodyogaLanding() {
  const { data: products } = useQuery({
    queryKey: ["bodyoga-products"],
    queryFn: () => listProducts({ onlyInStock: false }),
  });

  const { data: rituals } = useQuery({
    queryKey: ["bodyoga-rituals-active"],
    queryFn: listActiveRituals,
  });

  const ritualProducts = products ?? [];

  return (
    <div className="bodyoga-scope bg-bodyoga-cream text-bodyoga-green min-h-screen">
      <BodyogaHeader alwaysGreen />

      {/* HERO SLIDER */}
      <BodyogaHeroSlider />

      {/* BENEFÍCIOS */}
      <section className="bg-bodyoga-cream text-bodyoga-green">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            
            <h2 className="font-display text-3xl md:text-4xl mt-4 text-bodyoga-green">
              Cuidado natural em cada detalhe
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-12 mt-16">
            {beneficios.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="text-center px-2 w-40 md:w-56">
                  <div className="w-16 h-16 mx-auto rounded-full border border-bodyoga-green/40 flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-bodyoga-green" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-base md:text-lg text-bodyoga-green">{b.title}</h3>
                  <p className="mt-2 text-sm text-bodyoga-green/70 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RITUAIS POR CATEGORIA */}
      {(rituals ?? []).length > 0 && (
        <RitualCategories products={ritualProducts} />
      )}

      {/* INTRO ELISA HOEPPERS */}
      <section className="bg-bodyoga-cream overflow-hidden">
        <div className="max-w-[1170px] mx-auto px-6 md:px-10 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Imagem da Elisa */}
            <div className="md:col-span-6 relative">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-bodyoga-green/5">
                <img
                  src="/images/home/bodyoga/bodyoga-left.png"
                  alt="Elisa Hoeppers com os pesinhos BODYOGA"
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>

            {/* Conteúdo de texto */}
            <div className="md:col-span-6 flex flex-col justify-center space-y-10 mt-12 md:mt-0">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-bodyoga-green leading-[1.15]">
                BODYOGA é a <br />fusão entre <span className="italic">yoga</span> e <br />cuidado consciente.
              </h2>

              <div className="space-y-6 max-w-md">
                <p className="text-lg md:text-xl text-bodyoga-green/80 font-light leading-relaxed">
                  Cada produto é um ritual pensado pra trazer presença ao gesto cotidiano de cuidar de si.
                </p>
                <p className="text-sm md:text-base text-bodyoga-green font-medium leading-relaxed tracking-wide">
                  Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente.
                </p>
              </div>

              <div>
                <Link
                  to="/sobre"
                  className="group inline-flex items-center gap-2 px-7 py-4 rounded-full border border-bodyoga-green/20 hover:bg-bodyoga-green hover:border-bodyoga-green transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <span className="text-[11px] uppercase tracking-[0.3em] text-bodyoga-green group-hover:text-bodyoga-cream font-semibold transition-colors">
                    Harmonia &amp; Equilíbrio
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>



      <HomeBlog />
      <HomeInstagram />


      <Footer />
    </div>
  );
}

function RitualCategories({ products }: { products: Product[] }) {


  return (
    <section id="rituais" className="bg-bodyoga-cream scroll-mt-24">
      {/* Todos os produtos listados, sem divisão, sem contorno, sem slider */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-8 px-4 md:px-8 py-8 md:py-16 max-w-[1280px] mx-auto">
        {products.map((p) => (
          <BodyogaProductCard key={p.slug} product={p} noBorder />
        ))}
      </div>
    </section>
  );
}






function BodyogaProductCard({ product, noBorder = false }: { product: Product; noBorder?: boolean }) {
  const img = firstImage(product);
  const [main, sub] = product.name.split("—").map((s) => s.trim());

  return (
    <Link
      to="/loja/$slug"
      params={{ slug: product.slug }}
      className={`group block bg-bodyoga-cream rounded-2xl overflow-hidden transition ${noBorder ? "" : "border border-bodyoga-brown/15 hover:border-bodyoga-brown/40"}`}
    >
      <div className="relative aspect-square overflow-hidden bg-bodyoga-green/5">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={hideOnError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-10 h-10 text-bodyoga-green/30" />
          </div>
        )}
      </div>
      <div className="p-6">
        {sub && (
          <p className="text-xs uppercase tracking-[0.2em] text-bodyoga-brown">{sub}</p>
        )}
        <h3 className="font-display text-lg text-bodyoga-green mt-1">{main}</h3>
        {product.short_description && (
          <p className="mt-2 text-sm text-bodyoga-green/70 leading-relaxed line-clamp-3">
            {product.short_description}
          </p>
        )}
        <div className="mt-5">
          <span className="block text-bodyoga-green font-medium">
            {formatPriceBRL(product.price_cents)}
          </span>
          <span className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-full bg-bodyoga-green px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-bodyoga-cream transition">
            Comprar <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
