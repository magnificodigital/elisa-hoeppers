import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CustomProjectForm } from "@/components/projetos/CustomProjectForm";
import { useIsMobile } from "@/hooks/use-mobile";

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
import { GaleriaProduto } from "@/components/produto/GaleriaProduto";
import { listProducts, listActiveRituals, formatPriceBRL, type Product, type Slide } from "@/lib/shop";
import { getSetting } from "@/lib/settings";
import iconAsset from "@/assets/bodyoga/icone-bodyoga-2.png.asset.json";

const INTRO_DEFAULTS: Record<string, string> = {
  home_intro_title: "BODYOGA é a\nfusão entre *yoga* e\ncuidado consciente.",
  home_intro_p1: "Cada produto é um ritual pensado pra trazer presença ao gesto cotidiano de cuidar de si.",
  home_intro_p2:
    "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente.",
  home_intro_cta_label: "Harmonia & Equilíbrio",
  home_intro_cta_href: "/sobre",
  home_intro_image: "/images/home/bodyoga/bodyoga-left.png",
  home_custom_projects_title: "Sua marca tem um cheiro.",
  home_custom_projects_subtitle: "Vamos criá-lo juntos.",
  home_custom_projects_cta: "Solicitar projeto",
};

async function fetchIntro(): Promise<Record<string, string>> {
  const keys = Object.keys(INTRO_DEFAULTS);
  const entries = await Promise.all(
    keys.map(async (k) => {
      try {
        const v = await getSetting(k);
        return [k, v && v.trim() ? v : INTRO_DEFAULTS[k]] as const;
      } catch {
        return [k, INTRO_DEFAULTS[k]] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}

/** Renderiza quebras de linha e *itálico* do título configurável. */
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

export function BodyogaLanding({ initialSlides }: { initialSlides?: Slide[] } = {}) {
  const isMobile = useIsMobile();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const { data: products } = useQuery({
    queryKey: ["bodyoga-products"],
    queryFn: () => listProducts({ onlyInStock: false }),
  });

  const { data: rituals } = useQuery({
    queryKey: ["bodyoga-rituals-active"],
    queryFn: listActiveRituals,
  });

  const { data: introData } = useQuery({
    queryKey: ["home-intro"],
    queryFn: fetchIntro,
    staleTime: 5 * 60 * 1000,
  });
  const intro = introData ?? INTRO_DEFAULTS;

  const ritualProducts = products ?? [];


  return (
    <div className="bodyoga-scope bg-bodyoga-cream text-bodyoga-green min-h-screen">
      <BodyogaHeader alwaysGreen />

      {/* HERO SLIDER */}
      <BodyogaHeroSlider initialSlides={initialSlides} />

      {/* FRASE DE ABERTURA */}
      <section className="bg-bodyoga-cream">
        <div className="max-w-[900px] mx-auto px-6 py-6 md:py-10 flex flex-col items-center text-center">
          <img
            src={iconAsset.url}
            alt="BODYOGA"
            className="w-28 md:w-40 h-auto mb-3"
            loading="lazy"
          />
          <p className="font-display text-2xl md:text-4xl text-bodyoga-green leading-snug">
            Equilíbrio para o corpo,
            <br />
            mente e ambiente.
          </p>
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
                  src={intro.home_intro_image || INTRO_DEFAULTS.home_intro_image}
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
                {renderIntroTitle(intro.home_intro_title)}
              </h2>

              <div className="space-y-6 max-w-md">
                {intro.home_intro_p1 && (
                  <p className="text-lg md:text-xl text-bodyoga-green/80 font-light leading-relaxed whitespace-pre-line">
                    {intro.home_intro_p1}
                  </p>
                )}
                {intro.home_intro_p2 && (
                  <p className="text-sm md:text-base text-bodyoga-green font-medium leading-relaxed tracking-wide whitespace-pre-line">
                    {intro.home_intro_p2}
                  </p>
                )}
              </div>

              {intro.home_intro_cta_label && (
                <div>
                  <a
                    href={intro.home_intro_cta_href || "/sobre"}
                    className="group inline-flex items-center gap-2 px-7 py-4 rounded-full border border-bodyoga-green/20 hover:bg-bodyoga-green hover:border-bodyoga-green transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <span className="text-[11px] uppercase tracking-[0.3em] text-bodyoga-green group-hover:text-bodyoga-cream font-semibold transition-colors">
                      {intro.home_intro_cta_label}
                    </span>
                  </a>
                </div>
              )}
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
      <span id="produtos" className="block -mt-24 pt-24" aria-hidden />
      {/* Todos os produtos listados, sem divisão, sem contorno, sem slider */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-4 md:px-8 py-8 md:py-16 max-w-[1280px] mx-auto">
        {products.map((p) => (
          <BodyogaProductCard key={p.slug} product={p} noBorder />
        ))}
      </div>
    </section>
  );
}






function BodyogaProductCard({ product, noBorder = false }: { product: Product; noBorder?: boolean }) {
  const [main, sub] = product.name.split("—").map((s) => s.trim());

  return (
    <Link
      to="/loja/$slug"
      params={{ slug: product.slug }}
      className={`group block bg-bodyoga-cream rounded-2xl overflow-hidden transition ${noBorder ? "" : "border border-bodyoga-brown/15 hover:border-bodyoga-brown/40"}`}
    >
      <div className="relative aspect-square overflow-hidden bg-bodyoga-green/5">
        <GaleriaProduto 
          images={product.gallery?.map(g => g.url) || []} 
          alt={product.name}
          showControls={false}
        />
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
