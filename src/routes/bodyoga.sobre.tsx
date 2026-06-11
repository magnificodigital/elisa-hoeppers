import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import { BodyogaFooter } from "@/components/bodyoga/BodyogaFooter";
import { BodyogaLogo } from "@/components/bodyoga/BodyogaLogo";

export const Route = createFileRoute("/bodyoga/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — BODYOGA" },
      {
        name: "description",
        content:
          "A história da BODYOGA. Marca criada por Elisa Hoeppers Casas, inspirada no equilíbrio entre yoga e cuidado natural.",
      },
    ],
  }),
  component: BodyogaSobre,
});

function BodyogaSobre() {
  return (
    <div className="bodyoga-scope bg-bodyoga-cream text-bodyoga-green min-h-screen">
      <BodyogaHeader />

      {/* HERO */}
      <section className="bg-bodyoga-green text-bodyoga-cream">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-24 md:py-32 text-center">
          <BodyogaLogo size={64} className="mx-auto mb-8 [&_circle:first-child]:!fill-[var(--bodyoga-cream)] [&_path]:!stroke-[var(--bodyoga-green)] [&_circle:last-child]:!fill-[var(--bodyoga-green)]" />
          <span className="text-xs uppercase tracking-[0.3em] text-bodyoga-cream/70">Equilíbrio</span>
          <h1 className="font-display text-4xl md:text-5xl mt-4">A essência da BODYOGA</h1>
        </div>
      </section>

      {/* CONCEITO */}
      <section className="bg-bodyoga-cream">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-20 md:py-24">
          <p className="font-display text-2xl md:text-3xl text-bodyoga-green leading-snug">
            Inspirado em uma posição de yoga, a marca tem como sua principal ideia o equilíbrio.
          </p>
          <div className="mt-8 space-y-5 text-bodyoga-green/80 leading-relaxed">
            <p>
              A técnica usada para acalmar a mente e o corpo nos permite ver formas através dos corpos que a praticam. Seguindo essa lógica, o logo posiciona um corpo em seu centro e forma a letra Y com formas geométricas soltas, porém firmes.
            </p>
            <p>
              A paleta de cores tem como base um verde escuro trazendo segurança e seguindo a essência da marca.
            </p>
          </div>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="bg-bodyoga-brown/15">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-20 md:py-24">
          <span className="text-xs uppercase tracking-[0.3em] text-bodyoga-brown">A história</span>
          <h2 className="font-display text-3xl md:text-4xl mt-4 text-bodyoga-green">
            Yoga não é um treino; é um trabalho interno.
          </h2>
          <div className="mt-8 space-y-5 text-bodyoga-green/80 leading-relaxed">
            <blockquote className="border-l-2 border-bodyoga-brown pl-5 italic text-bodyoga-green/90">
              "Este é o ponto da prática espiritual: nos tornar ensináveis, abrir nossos corações e focar nossa consciência para que possamos saber o que já sabemos e ser quem já somos."
              <br />
              <span className="not-italic text-sm">— Rolf Gates</span>
            </blockquote>
            <p>
              Em uma jornada espiritual que remonta há 5 mil anos na Índia, o yoga nasceu como uma busca pela evolução total do ser humano. O ternário corpo — mente — espírito promove o bem-estar em todos os níveis da existência.
            </p>
            <p>
              Hoje, essa prática milenar transcende as fronteiras do tempo. Em um mundo marcado pela correria, o yoga e o cuidado natural parecem ser um privilégio, quando deveriam ser aliados essenciais na busca por equilíbrio.
            </p>
            <p>
              Compreendendo as exigências do dia a dia, a professora de yoga Elisa Hoeppers Casas reconheceu a importância de uma abordagem mais integrativa. Foi assim que surgiu o conceito do BODYOGA — fusão inteligente entre yoga e cuidado consciente, projetada para mulheres que enfrentam uma rotina agitada e com tempo limitado.
            </p>
            <p>
              Cada produto é um ritual. Feito à mão, em pequenos lotes, com a mesma atenção que ela dedica a cada aula. Não se trata apenas de cuidar do corpo, mas de fortalecer a conexão mente-corpo no gesto cotidiano.
            </p>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="bg-bodyoga-cream">
        <div className="max-w-[1170px] mx-auto px-4 md:px-6 py-20 md:py-24">
          <h2 className="font-display text-3xl md:text-4xl text-bodyoga-green text-center">
            Nossos compromissos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              { title: "Natural", desc: "Ingredientes vegetais e óleos essenciais puros." },
              { title: "Vegano", desc: "Sem ingredientes de origem animal." },
              { title: "Cruelty Free", desc: "Nunca testamos em animais." },
              { title: "Pequenos lotes", desc: "Feito à mão, com presença e cuidado." },
            ].map((v) => (
              <div key={v.title} className="bg-bodyoga-brown/10 rounded-2xl p-8 text-center">
                <h3 className="font-display text-lg text-bodyoga-green">{v.title}</h3>
                <p className="mt-2 text-sm text-bodyoga-green/70 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-bodyoga-green text-bodyoga-cream">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-20 md:py-28 text-center">
          <BodyogaLogo size={48} className="mx-auto mb-6 [&_circle:first-child]:!fill-[var(--bodyoga-cream)] [&_path]:!stroke-[var(--bodyoga-green)] [&_circle:last-child]:!fill-[var(--bodyoga-green)]" />
          <h2 className="font-display text-3xl md:text-4xl">Comece seu ritual.</h2>
          <p className="mt-4 text-bodyoga-cream/80 leading-relaxed">
            Conheça a linha de cosméticos naturais BODYOGA e leve presença pro seu dia a dia.
          </p>
          <Link
            to="/loja"
            search={{ brand: "bodyoga" }}
            className="inline-flex items-center gap-2 mt-8 px-7 py-3 rounded-full bg-bodyoga-cream text-bodyoga-green text-sm uppercase tracking-[0.18em] hover:bg-bodyoga-brown hover:text-bodyoga-cream transition"
          >
            Ver nossa linha <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <BodyogaFooter />
    </div>
  );
}
