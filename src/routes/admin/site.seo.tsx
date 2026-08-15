import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Search, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { SettingsCategory } from "@/components/admin/SettingsCategory";

export const Route = createFileRoute("/admin/site/seo")({
  head: () => ({ meta: [{ title: "Admin — SEO" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  return (
    <Layout>
      <section className="py-12 md:py-16 bg-background min-h-[70vh]">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            to="/admin/site"
            className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6"
          >
            <ChevronLeft size={16} /> Voltar
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
              <Search size={20} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl text-primary-dark">SEO</h1>
          </div>
          <p className="text-sm text-primary-dark/60 mb-6">
            Aprimoramentos para buscadores (Google, Bing) e para o modo como o site aparece quando
            compartilhado em redes sociais e WhatsApp.
          </p>

          <div className="bg-white rounded-xl p-6 shadow-none border border-border/20">
            <SettingsCategory category="seo" />
          </div>

          <div className="mt-6 bg-white rounded-xl p-6 shadow-none border border-border/20">
            <h2 className="font-display text-xl text-primary-dark mb-3">Ferramentas úteis</h2>
            <ul className="space-y-2 text-sm text-primary-dark/80">
              <li className="flex items-start gap-2">
                <ExternalLink size={14} className="mt-0.5 text-primary shrink-0" />
                <a
                  href="https://bodyogaoficial.com.br/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Sitemap.xml (gerado automaticamente com posts, cursos e produtos)
                </a>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink size={14} className="mt-0.5 text-primary shrink-0" />
                <a
                  href="https://bodyogaoficial.com.br/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Robots.txt
                </a>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink size={14} className="mt-0.5 text-primary shrink-0" />
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Google Search Console — indexação, cobertura e desempenho
                </a>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink size={14} className="mt-0.5 text-primary shrink-0" />
                <a
                  href="https://developers.facebook.com/tools/debug/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Facebook Sharing Debugger — atualizar prévia de compartilhamento
                </a>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink size={14} className="mt-0.5 text-primary shrink-0" />
                <a
                  href="https://pagespeed.web.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  PageSpeed Insights — performance e Core Web Vitals
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}
