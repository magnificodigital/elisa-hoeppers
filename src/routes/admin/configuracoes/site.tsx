import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Globe } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/configuracoes/site")({
  head: () => ({ meta: [{ title: "Admin — Site" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            to="/admin/configuracoes"
            className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6"
          >
            <ChevronLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
              <Globe size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">Site</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-6">
            Feed do Instagram e handle. O feed é fornecido pelo{" "}
            <a
              href="https://behold.so"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Behold ↗
            </a>
          </p>

          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20">
            <SettingsCategory category="site" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
