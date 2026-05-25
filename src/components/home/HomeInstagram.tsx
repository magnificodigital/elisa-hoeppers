const igImages = [
  "/images/instagram/ig-01.jpg",
  "/images/instagram/ig-02.jpg",
  "/images/instagram/ig-03.jpg",
  "/images/instagram/ig-04.jpg",
];

const HomeInstagram = () => {
  return (
    <section className="py-20 md:py-24 bg-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <h3 className="text-center text-primary-dark font-medium text-base md:text-lg mb-8">
          Acompanhe{" "}
          <a
            href="https://instagram.com/elisahoepperscasas"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-primary"
          >
            @elisahoepperscasas
          </a>{" "}
          no Instagram
        </h3>
        <div className="flex items-center justify-center gap-4 mb-10">
          <img
            src="/images/home/instagram/round-2.png"
            alt="Foto de perfil de Elisa Hoeppers"
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
          <div className="max-w-md">
            <p className="text-primary-dark font-semibold text-sm">elisahoepperscasas</p>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              Fundadora do @bodyoga__ ® · Professora de YOGA · Alquimia Olfativa ·
              Aromaterapia com Óleos Essenciais: Elisa Hoeppers Casas
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {igImages.map((src, i) => (
            <a
              key={i}
              href="https://instagram.com/elisahoepperscasas"
              target="_blank"
              rel="noreferrer"
              className="aspect-square overflow-hidden rounded-md"
            >
              <img
                src={src}
                alt={`Publicação ${i + 1} do Instagram de Elisa Hoeppers`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeInstagram;
