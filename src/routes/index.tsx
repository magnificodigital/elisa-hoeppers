import { createFileRoute } from "@tanstack/react-router";
import { BodyogaLanding } from "@/components/bodyoga/BodyogaLanding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BODYOGA — Rituais para corpo, mente e ambiente" },
      {
        name: "description",
        content:
          "Cosméticos naturais artesanais com óleos essenciais. Spray antisséptico, spray aromático de ambiente e sabonete natural — criados por Elisa Hoeppers Casas.",
      },
      { property: "og:title", content: "BODYOGA — Rituais para corpo, mente e ambiente" },
      {
        property: "og:description",
        content:
          "Cosméticos naturais artesanais com óleos essenciais, criados à mão por Elisa Hoeppers Casas.",
      },
    ],
  }),
  component: BodyogaLanding,
});
