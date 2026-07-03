import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, GalleryHorizontal } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/site")({
  head: () => ({ meta: [{ title: "Admin — Site" }] }),
  component: () => (
    <AdminGuard>
      <SitePage />
    </AdminGuard>
  ),
});

const OPTIONS = [
  {
    to: "/admin/bodyoga-rituais",
    label: "Rituais",
    description: "Gerencie os rituais BODYOGA e seus produtos.",
    icon: Sparkles,
  },
  {
    to: "/admin/bodyoga-slides",
    label: "Slides",
    description: "Gerencie os slides do banner principal.",
    icon: GalleryHorizontal,
  },
] as const;

function SitePage() {
  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl font-semibold text-[#3B4F30] mb-1">Site</h1>
        <p className="text-sm text-[#3B4F30]/70 mb-6">
          Escolha o que deseja gerenciar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <Link
                key={opt.to}
                to={opt.to}
                className="group flex items-start gap-4 rounded-2xl border border-[#DBCCBF]/60 bg-white p-6 transition-colors hover:border-[#3B4F30] hover:bg-[#3B4F30]/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3B4F30]/10 text-[#3B4F30] group-hover:bg-[#3B4F30] group-hover:text-[#DBCCBF] transition-colors">
                  <Icon size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#3B4F30]">
                    {opt.label}
                  </h2>
                  <p className="text-sm text-[#3B4F30]/70 mt-1">
                    {opt.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
