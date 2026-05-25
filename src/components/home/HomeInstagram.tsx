const igImages = [
  "/images/home/ig-1.jpg",
  "/images/home/ig-2.jpg",
  "/images/home/ig-3.jpg",
  "/images/home/ig-4.jpg",
];

const fallback = [
  "https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80",
  "https://images.unsplash.com/photo-1593810450967-f9c42742e326?w=600&q=80",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
  "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=600&q=80",
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
          <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            EH
          </div>
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
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = fallback[i];
                }}
                alt={`Instagram ${i + 1}`}
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
