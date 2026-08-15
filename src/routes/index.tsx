import { createFileRoute } from "@tanstack/react-router";
import { BodyogaLanding } from "@/components/bodyoga/BodyogaLanding";
import { listPages } from "@/lib/pages";
import { RenderBlocks } from "@/components/admin/RenderBlocks";
import BaseLayout from "@/components/Layout";
import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import Footer from "@/components/Footer";
import { listActiveSlides } from "@/lib/shop";

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }) => {
    const [slides, pages] = await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ["bodyoga-slides-active"],
        queryFn: listActiveSlides,
      }),
      listPages()
    ]);
    const homePage = pages.find(p => p.is_home && p.status === 'active');
    return { slides, homePage };
  },
  head: () => ({
    title: "BODYOGA — Corpo, mente e ambiente em equilíbrio",
    meta: [
      {
        name: "description",
        content: "Cosméticos naturais artesanais com óleos essenciais criados por Elisa Hoeppers Casas.",
      },
      { property: "og:title", content: "BODYOGA — Corpo, mente e ambiente em equilíbrio" },
      { property: "og:description", content: "Cosméticos naturais artesanais com óleos essenciais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  const { slides, homePage } = Route.useLoaderData();

  if (homePage) {
    return (
      <div className="bodyoga-scope bg-bodyoga-cream text-bodyoga-green min-h-screen">
        <BodyogaHeader alwaysGreen />
        <RenderBlocks blocks={homePage.blocks || []} />
        <Footer />
      </div>
    );
  }

  return <BodyogaLanding initialSlides={slides} />;
}
