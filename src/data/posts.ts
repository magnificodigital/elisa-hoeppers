export type Post = {
  slug: string;
  title: string;
  image: string;
};

export const posts: Post[] = [
  {
    slug: "tipos-de-yoga",
    title: "Os diferentes tipos de yoga e como escolher o seu",
    image: "/images/home/post-tipos-yoga.jpg",
  },
  {
    slug: "beneficios-yoga-saude-mental",
    title: "5 benefícios do yoga para a saúde mental",
    image: "/images/home/post-saude-mental.jpg",
  },
  {
    slug: "oleos-essenciais-rotina",
    title: "Como usar óleos essenciais na rotina de cuidados pessoais",
    image: "/images/home/post-oleos-rotina.jpg",
  },
];
