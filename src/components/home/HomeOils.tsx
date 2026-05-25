import { Link } from "@tanstack/react-router";

const HomeOils = () => {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-display text-3xl md:text-[2rem] text-primary-dark mb-6">
            Óleos Essenciais
          </h2>
          <div className="space-y-4 text-[var(--text-muted)] text-sm md:text-base leading-relaxed">
            <p>
              Que tal entrar em contato com o seu eu interior e ainda desfrutar dos benefícios
              dos óleos essenciais naturais?
            </p>
            <p>
              O spray Elisa Hoeppers é um blend de óleos sagrados com aromas terrosos e ancestrais,
              criado para promover equilíbrio, ânimo e redução da ansiedade.
            </p>
            <p>
              Uma mistura especial com óleos essenciais que acalma, amplia e harmoniza o cuidado
              do campo sutil. Acolhe os conflitos e ansiedades do dia a dia.
            </p>
            <p>
              Ótimo apoio para usar antes de dormir, na sua prática de yoga, meditação e
              sempre que você desejar entrar em si.
            </p>
            <p>
              Borrife no ambiente de trabalho para renovar a energia, ou sobre o travesseiro
              antes de dormir para um descanso mais profundo.
            </p>
            <p>
              Descubra o spray Elisa Hoeppers e transforme sua rotina em um agradável momento
              de bem-estar.
            </p>
          </div>
          <Link
            to="/loja"
            className="inline-block mt-8 bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs hover:bg-primary-dark transition"
          >
            Ir para Shop
          </Link>
        </div>
        <img
          src="/images/home/elisa-oleos.jpg"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1611073615452-4889ade07ef0?w=900&q=80";
          }}
          alt="Elisa com spray de óleos essenciais"
          className="rounded-lg w-full aspect-[3/4] object-cover"
        />
      </div>
    </section>
  );
};

export default HomeOils;
