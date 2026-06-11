import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Sparkles, Flower2, Sprout, ArrowRight } from "lucide-react";
import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import { BodyogaFooter } from "@/components/bodyoga/BodyogaFooter";
import { BodyogaLogo } from "@/components/bodyoga/BodyogaLogo";
import { listProducts, formatPriceBRL, firstImage, type Product } from "@/lib/shop";
import heroBg from "@/assets/bodyoga/hero-bg.jpg";

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
      <section className="relative overflow-hidden bg-bodyoga-cream">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 pointer-events-none"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bodyoga-cream via-bodyoga-cream/80 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-[1170px] mx-auto px-4 md:px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl md:text-5xl leading-tight text-bodyoga-green">
              <span className="whitespace-nowrap">Rituais para corpo,</span>
              <br />
              <span className="whitespace-nowrap">mente e ambiente.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-bodyoga-green/80 leading-relaxed">
              <span className="whitespace-nowrap">Cosméticos naturais artesanais com óleos essenciais.</span>
              <br />
              <span className="whitespace-nowrap">Criados à mão por Elisa Hoeppers Casas,</span>
              <br />
              <span className="whitespace-nowrap">no encontro entre o yoga e o cuidado natural.</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#produtos"
                className="px-7 py-3 rounded-full bg-bodyoga-green text-bodyoga-cream text-sm uppercase tracking-[0.18em] hover:bg-bodyoga-brown transition"
              >
                Conhecer rituais
              </a>
            </div>
          </div>

          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-bodyoga-green/10">
            <img
              src="/images/bodyoga/hero.jpg"
              alt="Rituais BODYOGA"
              className="w-full h-full object-cover"
              onError={hideOnError}
              loading="lazy"
            />
          </div>
        </div>
      </section>

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
