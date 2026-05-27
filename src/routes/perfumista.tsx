import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import Layout from "@/components/Layout";

export const Route = createFileRoute("/perfumista")({
  head: () => ({
    meta: [
      { title: "Elisa Casas — perfumista" },
      { name: "description", content: "Perfumaria autoral por Elisa Casas. Composições que nascem da fusão entre natureza, memória e identidade." },
      { property: "og:title", content: "Elisa Casas — perfumista" },
      { property: "og:description", content: "Perfumaria autoral por Elisa Casas." },
      { property: "og:image", content: "/images/home/oleos/oleos-elisa.jpeg" },
    ],
  }),
  component: PerfumistaPage,
});

function PerfumistaPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-cream py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Texto */}
            <div className="order-2 md:order-1">
              <p className="text-xs uppercase tracking-[0.25em] text-primary/60 mb-3">
                elisa casas
              </p>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-primary-dark mb-6 leading-[0.95]">
                perfumista
              </h1>
              <p className="text-lg md:text-xl text-primary/80 mb-8 leading-relaxed max-w-lg">
                Composições autorais que nascem da fusão entre natureza, memória, identidade e alma.
              </p>
              <Link
                to="/loja"
                className="inline-flex items-center gap-2 bg-primary text-cream px-8 py-3.5 rounded-full font-medium text-sm hover:bg-primary/90 transition"
              >
                <Sparkles className="w-4 h-4" />
                Descubra sua essência
              </Link>
            </div>

            {/* Imagem */}
            <div className="order-1 md:order-2">
              <img
                src="/images/home/oleos/oleos-elisa.jpeg"
                alt="Elisa Casas com frasco de perfume"
                className="w-full rounded-2xl shadow-lg object-cover aspect-[4/5]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bio em 3 blocos */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <p className="text-lg md:text-xl text-primary/85 leading-[1.8] mb-10">
            Desde a infância, meu mundo sempre foi guiado pelos sentidos. Cresci em meio à terra, às frutas e
            aos aromas da natureza, onde o olfato se tornou um elo invisível entre memórias e emoções. Esse
            instinto me levou à gastronomia, onde aprendi que sabores e cheiros compartilham a mesma linguagem:
            equilíbrio.
          </p>
          <p className="text-lg md:text-xl text-primary/85 leading-[1.8] mb-10">
            Minha busca pelo conhecimento me levou a estudar aromaterapia, perfumaria geral, botânica e
            blending olfativo, explorando a essência das matérias-primas e o impacto dos aromas na mente e no
            corpo. Foi nesse caminho que aprofundei minha formação em perfumaria, unindo técnica e
            sensibilidade para transformar essências em narrativas únicas.
          </p>
          <p className="text-lg md:text-xl text-primary/85 leading-[1.8]">
            Hoje, cada criação minha nasce dessa fusão entre natureza, memória, composição e identidade. O
            perfume não é apenas um detalhe — ele dá alma aos espaços, presença às pessoas e eterniza os
            momentos.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-cream mb-4">
            Vamos criar a sua?
          </h2>
          <p className="text-cream/80 text-lg mb-10 max-w-xl mx-auto">
            Composições personalizadas, sob medida. Fale comigo no WhatsApp pra entender o seu universo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/5511994061178"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-cream text-primary px-8 py-3.5 rounded-full font-medium text-sm hover:bg-cream/90 transition"
            >
              Falar no WhatsApp
            </a>
            <Link
              to="/loja"
              className="inline-flex items-center gap-2 border border-cream/40 text-cream px-8 py-3.5 rounded-full font-medium text-sm hover:bg-cream/10 transition"
            >
              Ver produtos
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
