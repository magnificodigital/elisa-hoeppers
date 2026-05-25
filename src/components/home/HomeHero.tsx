import { Link } from "@tanstack/react-router";

const HomeHero = () => {
  return (
    <section
      className="relative w-full h-[70vh] md:h-[80vh] min-h-[520px] overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage:
          "url('/images/home/hero.jpg'), url('https://images.unsplash.com/photo-1545389336-cf090694435e?w=1920&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 h-full flex items-end justify-center pb-20 md:pb-28">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <Link
            to="/agende-sua-aula"
            className="bg-primary/85 backdrop-blur-sm text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-primary transition"
          >
            Agende sua aula
          </Link>
          <Link
            to="/loja"
            className="border border-white text-white px-8 py-3 rounded-full uppercase tracking-widest text-xs font-medium hover:bg-white hover:text-primary transition"
          >
            Ver produtos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
