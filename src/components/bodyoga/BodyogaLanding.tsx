import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
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
import { listProducts, listActiveRituals, formatPriceBRL, firstImage, type Product, type Ritual } from "@/lib/shop";

import ritualCorpo from "@/assets/bodyoga/ritual-corpo.jpg";
import ritualMente from "@/assets/bodyoga/ritual-mente.jpg";
import ritualAmbiente from "@/assets/bodyoga/ritual-ambiente.jpg";

const RITUAL_FALLBACK_IMAGES: Record<string, string> = {
  corpo: ritualCorpo,
  mente: ritualMente,
  ambiente: ritualAmbiente,
};


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
        <RitualCategories rituals={rituals ?? []} products={ritualProducts} />
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

function RitualCategories({ rituals, products }: { rituals: Ritual[]; products: Product[] }) {
  const [active, setActive] = useState<string | null>(null);

  const productsFor = (c: Ritual) =>
    products.filter((p) =>
      p.ritual_ids && p.ritual_ids.length > 0
        ? p.ritual_ids.includes(c.id)
        : p.ritual_id === c.id,
    );

  return (
    <section id="rituais" className="bg-bodyoga-cream scroll-mt-24">
      {/* MOBILE: cartões empilhados */}
      <div className="md:hidden">
        {rituals.map((c) => {
          const catProducts = productsFor(c);
          const image = c.image_url || RITUAL_FALLBACK_IMAGES[c.slug] || ritualCorpo;
          return (
            <div key={c.id} className="border-b border-bodyoga-brown/10">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={image}
                  alt={c.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />

              </div>
              <RitualProductsSlider category={c} products={catProducts} hideHeader />
            </div>
          );
        })}
      </div>

      {/* DESKTOP: animação horizontal com hover */}
      <div
        className="hidden md:flex md:h-[640px]"
        onMouseLeave={() => setActive(null)}
      >
        {rituals.map((c) => {
          const isActive = c.id === active;
          const hidden = active !== null && !isActive;
          const catProducts = productsFor(c);
          const image = c.image_url || RITUAL_FALLBACK_IMAGES[c.slug] || ritualCorpo;
          return (
            <div
              key={c.id}
              onMouseEnter={() => setActive(c.id)}
              className="relative flex min-w-0 overflow-hidden transition-all duration-700 ease-out"
              style={{
                flexGrow: hidden ? 0 : 1,
                flexBasis: 0,
                width: hidden ? 0 : undefined,
                opacity: hidden ? 0 : 1,
              }}
            >
              {/* Imagem + título do ritual */}
              <div
                className="group relative h-full overflow-hidden text-center shrink-0 transition-all duration-700 ease-out"
                style={{
                  width: isActive ? "clamp(260px, 32%, 420px)" : "100%",
                  flexBasis: isActive ? "clamp(260px, 32%, 420px)" : "auto",
                  flexGrow: isActive ? 0 : 1,
                }}
              >
                <img
                  src={image}
                  alt={c.title}
                  width={768}
                  height={1024}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className={`absolute inset-0 transition-colors ${isActive ? "bg-black/15" : "bg-black/0 group-hover:bg-black/15"}`} />
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="font-display text-2xl lg:text-3xl text-bodyoga-cream drop-shadow">{c.title}</h3>
                  </div>
                )}
              </div>

              {/* Produtos do ritual (abre ao passar o mouse) */}
              {isActive && (
                <div className="flex-1 min-w-0 bg-bodyoga-cream md:h-full overflow-hidden animate-in fade-in duration-500">
                  <RitualProductsSlider category={c} products={catProducts} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}


function RitualProductsSlider({
  category,
  products,
  hideHeader = false,
}: {
  category: Ritual;
  products: Product[];
  hideHeader?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="h-full flex flex-col px-5 md:px-8 py-8 md:py-10">
      <div className={`items-center justify-between mb-5 ${hideHeader ? "hidden" : "flex"}`}>
        <div className="min-w-0">
          <h3 className="font-display text-xl md:text-2xl text-bodyoga-green truncate">
            {category.title}
          </h3>
          <p className="mt-1 text-sm text-bodyoga-green/70 line-clamp-2">{category.description}</p>
        </div>

        {products.length > 0 && (
          <div className="hidden md:flex gap-2 shrink-0 ml-4">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Anterior"
              className="w-10 h-10 rounded-full border border-bodyoga-green/30 text-bodyoga-green flex items-center justify-center hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Próximo"
              className="w-10 h-10 rounded-full border border-bodyoga-green/30 text-bodyoga-green flex items-center justify-center hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {products.length > 0 ? (
        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]"
        >
          {products.map((p) => (
            <div key={p.slug} className="snap-start shrink-0 w-[230px] md:w-[260px]">
              <BodyogaProductCard product={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-bodyoga-green/70">Em breve novos produtos para este ritual.</p>
          <Link
            to="/loja"
            search={{ brand: "bodyoga" }}
            className="inline-flex items-center gap-2 mt-6 text-sm uppercase tracking-[0.18em] text-bodyoga-green hover:text-bodyoga-brown transition"
          >
            Ver linha completa <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}



function BodyogaProductCard({ product }: { product: Product }) {
  const img = firstImage(product);
  const [main, sub] = product.name.split("—").map((s) => s.trim());

  return (
    <Link
      to="/loja/$slug"
      params={{ slug: product.slug }}
      className="group block bg-bodyoga-cream rounded-2xl overflow-hidden border border-bodyoga-brown/15 hover:border-bodyoga-brown/40 transition"
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
        <div className="mt-5 flex items-center justify-between">
          <span className="text-bodyoga-green font-medium">
            {formatPriceBRL(product.price_cents)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-bodyoga-green group-hover:text-bodyoga-brown transition">
            Ver <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
