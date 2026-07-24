import { createFileRoute } from "@tanstack/react-router";
import { BodyogaLanding } from "@/components/bodyoga/BodyogaLanding";

export const Route = createFileRoute("/bodyoga/")({
  head: () => ({
    meta: [
      { title: "BODYOGA — Corpo, mente e ambiente em equilíbrio" },
      {
        name: "description",
        content:
          "Cosméticos naturais artesanais com óleos essenciais. Spray antisséptico, spray aromático de ambiente e sabonete natural — criados por Elisa Hoeppers Casas.",
      },
    ],
  }),
  component: BodyogaLanding,
});
