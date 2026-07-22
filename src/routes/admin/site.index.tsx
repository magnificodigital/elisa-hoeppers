import { createFileRoute, Link } from "@tanstack/react-router";
import { GalleryHorizontal, Menu } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/site/")({
  head: () => ({ meta: [{ title: "Admin — Site" }] }),
  component: () => (
    <AdminGuard>
      <SitePage />
    </AdminGuard>
  ),
});

const OPTIONS = [
  {
    to: "/admin/bodyoga-slides",
    label: "Slides",
    description: "Gerencie os slides do banner principal.",
    icon: GalleryHorizontal,
  },
  {
  {
    to: "/admin/site/menu",
    label: "Menu de navegação",
    description: "Escolha o que aparece no header e no footer, e de que lado.",
    icon: Menu,
  },
] as const;


function SitePage() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Site</h1>
          <p className="text-primary-dark/70 mb-10">Selecione abaixo o que deseja gerenciar.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Link
                  key={opt.to}
                  to={opt.to}
                  className="bg-white rounded-xl p-6 shadow-sm flex items-start gap-3 hover:shadow-lg transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-xl text-primary-dark group-hover:text-primary transition">
                      {opt.label}
                    </h2>
                    <p className="text-sm text-primary-dark/60 mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}

