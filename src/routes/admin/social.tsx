import { createFileRoute, Link } from "@tanstack/react-router";
import { Share2, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin/social")({
  head: () => ({ meta: [{ title: "Admin — Social Posts" }] }),
  component: () => (
    <AdminGuard>
      <SocialPostsPage />
    </AdminGuard>
  ),
});

function SocialPostsPage() {
  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-10">
        <Link
          to="/admin/posts"
          className="inline-flex items-center gap-1.5 text-sm text-primary-dark/70 hover:text-primary transition mb-5"
        >
          <ArrowLeft size={16} /> Voltar para Posts
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Share2 className="text-primary-dark" size={28} />
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark">Social Posts</h1>
        </div>
        <p className="text-primary-dark/70 mb-8">
          Gerencie publicações para redes sociais.
        </p>

        <div className="rounded-2xl border border-border bg-background/40 p-10 text-center">
          <Share2 className="mx-auto mb-4 text-primary-dark/40" size={40} />
          <h2 className="font-display text-xl text-primary-dark mb-2">Em breve</h2>
          <p className="text-primary-dark/60 max-w-md mx-auto">
            Esta área permitirá criar e organizar posts para as redes sociais.
          </p>
        </div>
      </div>
    </Layout>
  );
}
