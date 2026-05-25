export type Product = {
  slug: string;
  name: string;
  price: string | null;
  image: string;
  inStock: boolean;
};

export const products: Product[] = [
  {
    slug: "higienizador-organico",
    name: "Higienizador Orgânico para mãos",
    price: "R$ 71,00",
    image: "/images/home/product-higienizador.jpg",
    inStock: true,
  },
  {
    slug: "pesinhos-bodyoga",
    name: "Pesinhos BODYOGA",
    price: "R$ 480,00",
    image: "/images/home/product-pesinhos.jpg",
    inStock: true,
  },
  {
    slug: "sabonete-hidratante",
    name: "Sabonete hidratante",
    price: null,
    image: "/images/home/product-sabonete.jpg",
    inStock: false,
  },
  {
    slug: "difusores",
    name: "Difusores",
    price: null,
    image: "/images/home/product-difusores.jpg",
    inStock: false,
  },
  {
    slug: "spray-de-ambiente",
    name: "Spray de Ambiente",
    price: null,
    image: "/images/home/product-spray.jpg",
    inStock: false,
  },
  {
    slug: "blend-oleos-essenciais",
    name: "Blend de óleos essenciais",
    price: null,
    image: "/images/home/product-blend.jpg",
    inStock: false,
  },
];
