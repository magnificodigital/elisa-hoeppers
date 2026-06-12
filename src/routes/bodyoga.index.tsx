import { createFileRoute, Link } from "@tanstack/react-router";
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
import { BodyogaFooter } from "@/components/bodyoga/BodyogaFooter";
import { BodyogaLogo } from "@/components/bodyoga/BodyogaLogo";
import { listProducts, formatPriceBRL, firstImage, type Product } from "@/lib/shop";
import heroBg from "@/assets/bodyoga/hero-combined-v3.jpg";
import ritualCorpo from "@/assets/bodyoga/ritual-corpo.jpg";
import ritualMente from "@/assets/bodyoga/ritual-mente.jpg";
import ritualAmbiente from "@/assets/bodyoga/ritual-ambiente.jpg";

export const Route = createFileRoute("/bodyoga/")({
  head: () => ({
    meta: [
      { title: "BODYOGA — Rituais para corpo, mente e ambiente" },
      {
        name: "description",
        content:
          "Cosméticos naturais artesanais com óleos essenciais. Spray antisséptico, spray aromático de ambiente e sabonete natural — criados por Elisa Hoeppers Casas.",
      },
    ],
  }),
  component: BodyogaLanding,
});

const aromas = [
  { name: "Lavanda", desc: "Acalma a mente, reduz o estresse, traz tranquilidade.", icon: Leaf },
  { name: "Mandarina Verde", desc: "Revitaliza, traz leveza e alegria.", icon: Sparkles },
  { name: "Patchouli", desc: "Aterra, traz profundidade e acolhimento.", icon: Sprout },
  { name: "Gerânio", desc: "Equilibra emoções, harmoniza corpo, mente e ambiente.", icon: Flower2 },
];

const beneficios = [
  { title: "100% natural", desc: "Feito com ingredientes de origem vegetal.", icon: Leaf },
  { title: "Artesanal", desc: "Produzido à mão em pequenos lotes.", icon: HandHeart },
  { title: "Vegano", desc: "Sem ingredientes de origem animal.", icon: Sprout },
  { title: "Óleos essenciais", desc: "Aromaterapia pura em cada fórmula.", icon: FlaskConical },
  { title: "Cruelty free", desc: "Nunca testado em animais.", icon: PawPrint },
  { title: "Embalagem consciente", desc: "Materiais recicláveis e reaproveitáveis.", icon: Recycle },
  { title: "Livre de tóxicos", desc: "Sem parabenos, sulfatos ou fragrâncias artificiais.", icon: Wind },
  { title: "Fresquinho", desc: "Feito sob demanda, sempre recém-produzido.", icon: PackageOpen },
];

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

function BodyogaLanding() {
  const { data: products } = useQuery({
    queryKey: ["bodyoga-products"],
    queryFn: () => listProducts({ onlyInStock: false }),
  });

  const bodyogaProducts = (products ?? []).filter(
    (p) => (p.brand ?? "").toLowerCase() === "bodyoga",
  );

  return (
    <div className="bodyoga-scope bg-bodyoga-cream text-bodyoga-green min-h-screen">
      <BodyogaHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-bodyoga-cream -mt-24 pt-24">
        <div
          className="absolute inset-0 bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: "center center", backgroundSize: "cover" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bodyoga-cream via-bodyoga-cream/85 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-24 md:h-32 bg-gradient-to-b from-transparent to-bodyoga-cream pointer-events-none" />
        <div className="relative z-10 max-w-[1170px] mx-auto px-4 md:px-6 pt-40 md:pt-56 pb-24 md:pb-36 flex items-center justify-start min-h-[85vh]">
          <div className="relative max-w-xl">
            <div className="absolute -inset-x-16 -inset-y-14 backdrop-blur-md bg-[#E6DAC5]/55 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)] pointer-events-none" />
            <div className="relative">
            <h1 className="font-display text-4xl md:text-5xl leading-tight text-bodyoga-green">
              <span className="whitespace-nowrap">Rituais para corpo,</span>
              <br />
              <span className="whitespace-nowrap">mente e ambiente.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-bodyoga-green/80 leading-relaxed">
              <span className="whitespace-nowrap">Cosméticos naturais artesanais com óleos essenciais.</span>
              <br />
              <span className="whitespace-nowrap">Criados à mão por <strong className="font-bold">Elisa Hoeppers Casas</strong>, no encontro</span>
              <br />
              <span className="whitespace-nowrap">entre o yoga e o cuidado natural.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#produtos"
                className="px-7 py-3 rounded-full border border-bodyoga-green text-bodyoga-green text-sm font-medium uppercase tracking-[0.18em] hover:bg-bodyoga-green hover:text-bodyoga-cream transition"
              >
                Conhecer rituais
              </a>

            </div>
            </div>
          </div>
        </div>
      </section>

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
                BODYOGA é a fusão entre <span className="italic">yoga</span> e cuidado consciente.
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
                <div className="inline-block px-7 py-4 rounded-full border border-bodyoga-green/20">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-bodyoga-green font-semibold">
                    Harmonia &amp; Equilíbrio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* RITUAIS POR CATEGORIA */}
      <RitualCategories products={bodyogaProducts} />

      {/* MARCA */}
      <section className="bg-bodyoga-green text-bodyoga-cream">

        <div className="max-w-[1170px] mx-auto px-4 md:px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-bodyoga-cream/10 order-2 md:order-1">
            <img
              src="/images/bodyoga/marca.jpg"
              alt="A marca BODYOGA"
              className="w-full h-full object-cover"
              onError={hideOnError}
              loading="lazy"
            />
          </div>
          <div className="order-1 md:order-2">
            
            <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">
              Inspirado no Equilíbrio.
            </h2>
            <p className="mt-6 text-bodyoga-cream/80 leading-relaxed">
              BODYOGA é a fusão entre yoga e cuidado consciente. Cada produto é um ritual pensado pra trazer presença ao gesto cotidiano de cuidar de si.
            </p>
            <p className="mt-4 text-bodyoga-cream/80 leading-relaxed">
              Feito à mão em pequenos lotes, com óleos essenciais que acolhem, equilibram e harmonizam corpo, mente e ambiente.
            </p>
            <Link
              to="/bodyoga/sobre"
              className="inline-flex items-center gap-2 mt-8 text-sm uppercase tracking-[0.18em] text-bodyoga-cream hover:text-bodyoga-brown transition"
            >
              Conhecer toda a história <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUTOS */}
      <section id="produtos" className="bg-bodyoga-cream">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-bodyoga-brown">Os rituais</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4 text-bodyoga-green">Nossa linha</h2>
            <p className="mt-4 text-bodyoga-green/80 leading-relaxed">
              Três rituais para diferentes momentos do dia. Mãos, ambiente e banho — cada um com seu próprio aroma e propósito.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-14">
            {bodyogaProducts.map((p) => (
              <BodyogaProductCard key={p.slug} product={p} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/loja"
              search={{ brand: "bodyoga" }}
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-bodyoga-green hover:text-bodyoga-brown transition"
            >
              Ver linha completa no shop <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="bg-bodyoga-green text-bodyoga-cream">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-bodyoga-brown">Por que BODYOGA</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4 text-bodyoga-cream">
              Cuidado natural em cada detalhe
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 mt-16">
            {beneficios.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="text-center px-2">
                  <div className="w-16 h-16 mx-auto rounded-full border border-bodyoga-cream/40 flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-bodyoga-cream" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-base md:text-lg text-bodyoga-cream">{b.title}</h3>
                  <p className="mt-2 text-sm text-bodyoga-cream/70 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* AROMATERAPIA */}
      <section className="bg-bodyoga-brown/15">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-bodyoga-brown">Aromaterapia</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4 text-bodyoga-green">
              Óleos essenciais que cuidam
            </h2>
            <p className="mt-4 text-bodyoga-green/80 leading-relaxed">
              Os 4 aromas que compõem nossos rituais — cada um com sua própria intenção e benefício.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {aromas.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.name} className="bg-bodyoga-cream rounded-2xl p-8 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-bodyoga-green/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-bodyoga-green" />
                  </div>
                  <h3 className="font-display text-lg text-bodyoga-green">{a.name}</h3>
                  <p className="mt-2 text-sm text-bodyoga-green/70 leading-relaxed">{a.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ELISA */}
      <section className="bg-bodyoga-cream">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-bodyoga-green/10">
            <img
              src="/images/bodyoga/elisa.jpg"
              alt="Elisa Hoeppers Casas"
              className="w-full h-full object-cover"
              onError={hideOnError}
              loading="lazy"
            />
          </div>
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-bodyoga-brown">Criado à mão por</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4 text-bodyoga-green">
              Elisa Hoeppers Casas
            </h2>
            <p className="mt-6 text-bodyoga-green/80 leading-relaxed">
              Professora de yoga e fundadora do BODYOGA. Há 18 anos no caminho do yoga, dedicada a unir tradição ancestral e cuidado contemporâneo.
            </p>
            <p className="mt-4 text-bodyoga-green/80 leading-relaxed">
              Os produtos BODYOGA nasceram da própria prática — feitos em pequenos lotes, com a mesma atenção que ela dedica a cada aula.
            </p>
            <Link
              to="/bio"
              className="inline-flex items-center gap-2 mt-8 text-sm uppercase tracking-[0.18em] text-bodyoga-green hover:text-bodyoga-brown transition"
            >
              Conhecer Elisa <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <BodyogaFooter />
    </div>
  );
}

const ritualCategorias = [
  {
    id: "corpo",
    title: "Rituais do Corpo",
    desc: "Cuidado e presença no gesto de cuidar da pele e do toque.",
    image: ritualCorpo,
    match: (p: Product) =>
      /sabonete|antisseptico|antisséptico|banho|corpo|mao|mão/i.test(
        `${p.slug} ${p.name}`,
      ),
  },
  {
    id: "mente",
    title: "Rituais da Mente",
    desc: "Aromas que acalmam, equilibram e trazem foco e tranquilidade.",
    image: ritualMente,
    match: (p: Product) =>
      /medita|mente|calma|foco|lavanda/i.test(`${p.slug} ${p.name}`),
  },
  {
    id: "ambiente",
    title: "Rituais do Ambiente",
    desc: "Sprays aromáticos que harmonizam e perfumam cada espaço.",
    image: ritualAmbiente,
    match: (p: Product) =>
      /aromatico|aromático|ambiente|spray-aromatico/i.test(
        `${p.slug} ${p.name}`,
      ),
  },
];



function RitualCategories({ products }: { products: Product[] }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="bg-bodyoga-cream">
      <div
        className="flex flex-col md:flex-row md:h-[640px]"
        onMouseLeave={() => setActive(null)}
      >
        {ritualCategorias.map((c) => {
          const isActive = c.id === active;
          const hidden = active !== null && !isActive;
          const catProducts = products.filter((p) => c.match(p));
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
                className="group relative h-[420px] md:h-full overflow-hidden text-center shrink-0 transition-all duration-700 ease-out"
                style={{
                  width: isActive ? "clamp(260px, 32%, 420px)" : "100%",
                  flexBasis: isActive ? "clamp(260px, 32%, 420px)" : "auto",
                  flexGrow: isActive ? 0 : 1,
                }}
              >
                <img
                  src={c.image}
                  alt={c.title}
                  width={768}
                  height={1024}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className={`absolute inset-0 transition-colors ${isActive ? "bg-black/15" : "bg-black/0 group-hover:bg-black/15"}`} />
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
}: {
  category: (typeof ritualCategorias)[number];
  products: Product[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="h-full flex flex-col px-5 md:px-8 py-8 md:py-10">
      <div className="flex items-center justify-between mb-5">
        <div className="min-w-0">
          <h3 className="font-display text-xl md:text-2xl text-bodyoga-green truncate">
            {category.title}
          </h3>
          <p className="mt-1 text-sm text-bodyoga-green/70 line-clamp-2">{category.desc}</p>
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
