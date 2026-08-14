import { Link } from "@tanstack/react-router";

const HomeOils = () => {
  return (
    <section className="py-20 md:py-32 bg-bodyoga-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-16 md:gap-24">
        <div className="flex-1 order-2 md:order-1">
          <h2 className="font-display text-4xl md:text-[2.75rem] text-primary-dark mb-8 leading-tight">
            Óleos Essenciais
          </h2>
          <div className="space-y-6 text-[#4A5568] text-[15px] md:text-base leading-relaxed font-light">
            <p>
              Que tal deixar seu ambiente com um aroma delicioso e ainda desfrutar dos
              benefícios dos óleos essenciais naturais?
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
            className="inline-block mt-12 bg-primary text-white px-10 py-3.5 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition-all duration-300"
          >
            IR PARA SHOP
          </Link>
        </div>
        <div className="flex-1 order-1 md:order-2 w-full">
          <img
            src="/images/home/oleos/oleos-elisa.jpeg"
            alt="Elisa Hoeppers segurando o spray de óleos essenciais"
            className="rounded-lg w-full object-cover shadow-sm"
           loading="lazy" decoding="async" />
        </div>
      </div>
    </section>
  );
};

export default HomeOils;
