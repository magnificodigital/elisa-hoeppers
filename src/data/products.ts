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
    image: "/images/products/higienizador-organico.png",
    inStock: true,
  },
  {
    slug: "pesinhos-bodyoga",
    name: "Pesinhos BODYOGA",
    price: "R$ 480,00",
    image: "/images/products/pesinhos-bodyoga.png",
    inStock: true,
  },
  {
    slug: "sabonete-hidratante",
    name: "Sabonete hidratante",
    price: null,
    image: "/images/products/sabonete-hidratante.png",
    inStock: false,
  },
  {
    slug: "difusores",
    name: "Difusores",
    price: null,
    image: "/images/products/difusores.png",
    inStock: false,
  },
  {
    slug: "spray-de-ambiente",
    name: "Spray de Ambiente",
    price: null,
    image: "/images/products/spray-ambiente.png",
    inStock: false,
  },
  {
    slug: "blend-oleos-essenciais",
    name: "Blend de óleos essenciais",
    price: null,
    image: "/images/products/blend-oleos-essenciais.png",
    inStock: false,
  },
];
