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
              Que tal deixar seu ambiente com um aroma delicioso e ainda desfrutar
              dos benefícios dos óleos essenciais naturais?
            </p>
            <p>
              O spray elisa hoeppers, contém um blend de óleos essenciais que traz
              equilíbrio, reduz a ansiedade e o estresse, proporciona ânimo, motivação
              e alegria.
            </p>
            <p>
              Uma sensação de paz no corpo e no espírito, estimula, amplia e harmoniza
              o equilíbrio do campo vital. Acolhe, traz conforto e amorosidade. Ótima
              opção para usar antes de dormir, na sua prática de yoga, meditação e
              também no seu ambiente de trabalho.
            </p>
            <p>
              Estimula a concentração, acalma a mente e possui efeito tranquilizante.
            </p>
            <p>
              Incorporar óleos essenciais em sua rotina diária pode ser a chave para
              uma vida mais equilibrada e saudável.
            </p>
            <p>
              Experimente o spray Elisa Hoeppers e transforme sua rotina em uma
              experiência de bem-estar!
            </p>
          </div>
          <Link
            to="/loja"
            className="inline-block mt-8 bg-primary text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs hover:bg-primary-dark transition"
          >
            IR PARA SHOP
          </Link>
        </div>
        <img
          src="/images/home/oleos/oleos-elisa.jpeg"
          alt="Elisa Hoeppers segurando o spray de óleos essenciais"
          className="rounded-lg w-full aspect-[3/4] object-cover"
        />
      </div>
    </section>
  );
};

export default HomeOils;
