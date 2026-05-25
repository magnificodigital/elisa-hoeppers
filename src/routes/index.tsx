import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/Layout";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Layout>
      <section className="bg-cream py-24 md:py-32">
        <div className="container mx-auto px-4 max-w-[1170px] text-center">
          <h1 className="font-display text-5xl md:text-7xl text-primary mb-6 leading-tight">
            Movimente seu corpo,<br />cuide da sua mente.
          </h1>
          <p className="text-xl text-primary/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Aulas de Yoga, Aromaterapia e produtos naturais para o seu bem-estar diário.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/agende-sua-aula"
              className="bg-primary text-white px-8 py-4 rounded-full font-semibold uppercase tracking-wider hover:bg-primary-dark transition-all w-full sm:w-auto"
            >
              Agende sua aula
            </a>
            <a
              href="/loja"
              className="border-2 border-primary text-primary px-8 py-4 rounded-full font-semibold uppercase tracking-wider hover:bg-primary hover:text-white transition-all w-full sm:w-auto"
            >
              Conheça a loja
            </a>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary/60 italic">Home completa virá no Prompt #2</p>
        </div>
      </section>
    </Layout>
  );
}
