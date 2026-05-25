export type Course = {
  slug: string;
  title: string;
  label: string;
  overlay: string;
  image: string;
};

export const courses: Course[] = [
  {
    slug: "bodyoga-ao-vivo",
    title: "Bodyoga – AO VIVO",
    label: "Bodyoga – AO VIVO",
    overlay: "BODYOGA",
    image: "/images/courses/bodyoga-ao-vivo.png",
  },
  {
    slug: "meditacao",
    title: "Meditação",
    label: "Meditação",
    overlay: "MEDITAÇÃO",
    image: "/images/courses/meditacao.png",
  },
  {
    slug: "yoga",
    title: "YOGA",
    label: "YOGA",
    overlay: "YOGA",
    image: "/images/courses/yoga.png",
  },
];
