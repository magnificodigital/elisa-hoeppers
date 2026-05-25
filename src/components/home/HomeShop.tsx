import { Link } from "@tanstack/react-router";
import { products } from "@/data/products";
import SectionTitle from "@/components/SectionTitle";

const HomeShop = () => {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-[1170px] mx-auto px-4 md:px-6">
        <SectionTitle>Shop</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 mt-12">
          {products.map((p) => (
            <Link key={p.slug} to="/loja" className="group block">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-sand">
                <img
                  src={p.image}
                  alt={`Foto do produto ${p.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {!p.inStock && (
                  <span className="absolute top-3 right-3 bg-primary-dark text-white text-[11px] px-3 py-1 rounded-md tracking-wide">
                    Fora De Estoque
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-base font-medium text-primary-dark">{p.name}</h3>
              {p.price && (
                <p className="text-sm text-[var(--text-muted)] mt-1">{p.price}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeShop;
