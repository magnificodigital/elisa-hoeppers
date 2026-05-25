export type Course = {
  slug: string;
  title: string;
  label: string;
  overlay: string;
  image: string;
};

export const courses: Course[] = [
  {
    slug: "bodyoga",
    title: "Bodyoga – AO VIVO",
    label: "BODYOGA",
    overlay: "BODYOGA",
    image: "/images/home/course-bodyoga.jpg",
  },
  {
    slug: "meditacao",
    title: "Meditação",
    label: "Meditação",
    overlay: "MEDITAÇÃO",
    image: "/images/home/course-meditacao.jpg",
  },
  {
    slug: "yoga",
    title: "YOGA",
    label: "YOGA",
    overlay: "YOGA",
    image: "/images/home/course-yoga.jpg",
  },
];
