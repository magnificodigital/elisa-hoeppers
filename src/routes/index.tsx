import { createFileRoute } from "@tanstack/react-router";
import { BodyogaLanding } from "@/components/bodyoga/BodyogaLanding";
import { listActiveSlides } from "@/lib/shop";

export const Route = createFileRoute("/")({
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
          "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente. Harmonia & Equilíbrio.",
      },
      { property: "og:title", content: "BODYOGA — Corpo, mente e ambiente em equilíbrio" },
      {
        property: "og:description",
        content:
          "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente. Harmonia & Equilíbrio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "BODYOGA — Corpo, mente e ambiente em equilíbrio" },
      {
        name: "twitter:description",
        content:
          "Feito à mão e em pequenos lotes, por Elisa Hoeppers Casas, para gerar equilíbrio e harmonizar o corpo, a mente e o ambiente. Harmonia & Equilíbrio.",
      },

    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  const { slides } = Route.useLoaderData();

  return <BodyogaLanding initialSlides={slides} />;
}
