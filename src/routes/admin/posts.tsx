import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Share2, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import { StaffGuard } from "@/components/StaffGuard";

export const Route = createFileRoute("/admin/posts")({
  head: () => ({ meta: [{ title: "Posts — Admin" }] }),
  component: () => (
    <StaffGuard>
      <PostsHome />
    </StaffGuard>
  ),
});

const options = [
  { to: "/admin/blog", icon: FileText, title: "Blog Posts", desc: "Crie e edite posts de Dicas." },
  { to: "/admin/social", icon: Share2, title: "Social Posts", desc: "Posts para as redes sociais." },
  { to: "/admin/broadcast", icon: Mail, title: "Emails", desc: "Envie email pra newsletter ou alunas." },
] as const;

function PostsHome() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl text-primary-dark mb-2">Posts</h1>
          <p className="text-primary-dark/70 mb-8">Escolha o tipo de conteúdo que deseja criar ou editar.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {options.map((o) => {
              const Icon = o.icon;
              return (
                <Link
                  key={o.to}
                  to={o.to}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition flex items-start gap-4 group"
                >
                  <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-primary-dark mb-1 group-hover:text-primary transition">
                      {o.title}
                    </h3>
                    <p className="text-sm text-primary-dark/60">{o.desc}</p>
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
