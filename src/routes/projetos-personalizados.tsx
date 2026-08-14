import { createFileRoute } from "@tanstack/react-router";
import { BodyogaHeader } from "@/components/bodyoga/BodyogaHeader";
import Footer from "@/components/Footer";
import { CustomProjectForm } from "@/components/projetos/CustomProjectForm";

export const Route = createFileRoute("/projetos-personalizados")({
  head: () => ({
    meta: [
      { title: "Projetos Sob Medida | BODYOGA" },
      { name: "description", content: "Fragrâncias exclusivas e brindes personalizados para sua empresa ou evento." },
    ],
  }),
  component: CustomProjectsPage,
});

function CustomProjectsPage() {
  return (
    <div className="min-h-screen bg-[#F7F0E5] text-[#3B4F30] flex flex-col">
      <BodyogaHeader alwaysGreen />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#3B4F30] text-[#F7F0E5] py-20 md:py-32">
          <div className="container mx-auto px-6 max-w-4xl text-center space-y-6">
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-tight">
              Projetos sob medida
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-90 max-w-2xl mx-auto leading-relaxed">
              Fragrâncias exclusivas e brindes personalizados para sua empresa ou evento.
            </p>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-6 max-w-2xl">
            <CustomProjectForm className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-[#3B4F30]/5" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
