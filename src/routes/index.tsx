import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/Layout";
import HomeHero from "@/components/home/HomeHero";
import HomeShop from "@/components/home/HomeShop";
import HomeCourses from "@/components/home/HomeCourses";
import HomeBodyoga from "@/components/home/HomeBodyoga";
import HomeOils from "@/components/home/HomeOils";
import HomeBio from "@/components/home/HomeBio";
import HomeReviews from "@/components/home/HomeReviews";
import HomeBlog from "@/components/home/HomeBlog";
import HomeNewsletter from "@/components/home/HomeNewsletter";
import HomeInstagram from "@/components/home/HomeInstagram";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elisa Hoeppers — Yoga, BODYOGA e Aromaterapia" },
      {
        name: "description",
        content:
          "Aulas de Hatha e Vinyasa Yoga, BODYOGA com pesinhos, óleos essenciais e cursos com Elisa Hoeppers Casas.",
      },
      { property: "og:title", content: "Elisa Hoeppers — Yoga, BODYOGA e Aromaterapia" },
      {
        property: "og:description",
        content:
          "Movimente seu corpo, cuide da sua mente. Aulas, BODYOGA e óleos essenciais com Elisa Hoeppers.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout noTopPadding transparentHeader>
      <HomeHero />
      <HomeShop />
      <HomeCourses />
      <HomeBodyoga />
      <HomeOils />
      <HomeBio />
      <HomeReviews />
      <HomeBlog />
      <HomeNewsletter />
      <HomeInstagram />
    </Layout>
  );
}
