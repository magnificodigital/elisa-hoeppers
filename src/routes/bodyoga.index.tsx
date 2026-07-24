import { createFileRoute } from "@tanstack/react-router";
import { BodyogaLanding } from "@/components/bodyoga/BodyogaLanding";
import { listActiveSlides } from "@/lib/shop";

export const Route = createFileRoute("/bodyoga/")({
  loader: async ({ context: { queryClient } }) => {
    const slides = await queryClient.ensureQueryData({
      queryKey: ["bodyoga-slides-active"],
      queryFn: listActiveSlides,
    });

    return { slides };
  },
  head: () => ({
    meta: [
      { title: "BODYOGA — Corpo, mente e ambiente em equilíbrio" },
      {
        name: "description",
        content:
          "Cosméticos naturais artesanais com óleos essenciais. Spray antisséptico, spray aromático de ambiente e sabonete natural — criados por Elisa Hoeppers Casas.",
      },
      { property: "og:title", content: "BODYOGA — Corpo, mente e ambiente em equilíbrio" },
      {
        property: "og:description",
        content:
          "Cosméticos naturais artesanais com óleos essenciais, criados à mão por Elisa Hoeppers Casas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "BODYOGA — Corpo, mente e ambiente em equilíbrio" },
      {
        name: "twitter:description",
        content:
          "Cosméticos naturais artesanais com óleos essenciais, criados à mão por Elisa Hoeppers Casas.",
      },
    ],
  }),
  component: BodyogaRoute,
});

function BodyogaRoute() {
  const { slides } = Route.useLoaderData();

  return <BodyogaLanding initialSlides={slides} />;
}
