export type Post = {
  slug: string;
  title: string;
  image: string;
};

export const posts: Post[] = [
  {
    slug: "tipos-de-yoga",
    title: "Os diferentes tipos de yoga e como escolher o seu",
    image: "/images/blog/tipos-de-yoga.jpg",
  },
  {
    slug: "yoga-saude-mental",
    title: "5 benefícios do yoga para a saúde mental",
    image: "/images/blog/yoga-saude-mental.png",
  },
  {
    slug: "oleos-essenciais-rotina",
    title: "Como usar óleos essenciais na rotina de cuidados pessoais",
    image: "/images/blog/oleos-essenciais-rotina.png",
  },
];
