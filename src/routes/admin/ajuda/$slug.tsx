import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Clock, Lightbulb, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { tutorials, categories, type Tutorial } from "@/data/tutorials";

export const Route = createFileRoute("/admin/ajuda/$slug")({
  loader: ({ params }) => {
    const t = tutorials.find((t) => t.id === params.slug);
    if (!t) throw notFound();
    return { tutorial: t };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.tutorial.title ?? "Tutorial"} — Ajuda` }],
  }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
  errorComponent: () => (
    <Layout>
      <section className="py-24 text-center">
        <p className="text-primary-dark mb-4">Erro ao carregar tutorial.</p>
        <Link to="/admin/ajuda" className="text-primary underline">
          Voltar pra ajuda
        </Link>
      </section>
    </Layout>
  ),
  notFoundComponent: () => (
    <Layout>
      <section className="py-24 text-center">
        <p className="text-primary-dark mb-4">Tutorial não encontrado.</p>
        <Link to="/admin/ajuda" className="text-primary underline">
          Voltar pra ajuda
        </Link>
      </section>
    </Layout>
  ),
});

function Page() {
  const { tutorial } = Route.useLoaderData() as { tutorial: Tutorial };
  const cat = categories[tutorial.category];

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            to="/admin/ajuda"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary-dark/60 hover:text-primary-dark mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Voltar
          </Link>

          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary-dark/60 mb-2">
              <span>{cat.icon}</span> {cat.label}
            </span>
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">
              {tutorial.title}
            </h1>
            <p className="text-primary-dark/70 mt-2">{tutorial.description}</p>
            <div className="inline-flex items-center gap-1 text-xs text-primary-dark/40 mt-3">
              <Clock className="w-3 h-3" />
              Leva ~{tutorial.estimatedMinutes} minutos
            </div>
          </div>

          <ol className="space-y-6">
            {tutorial.steps.map((step, i) => (
              <li key={i} className="bg-white rounded-xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-cream text-sm font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-primary-dark mb-2">{step.title}</h2>
                    <div className="text-sm text-primary-dark/80 leading-relaxed">
                      {renderBody(step.body)}
                    </div>

                    {step.image && (
                      <img
                        src={step.image}
                        alt={step.imageAlt ?? step.title}
                        className="mt-4 rounded-lg border border-border max-w-full"
                      />
                    )}

                    {step.tip && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-900">{step.tip}</p>
                      </div>
                    )}

                    {step.warning && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-900">{step.warning}</p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
            <p className="text-sm text-primary-dark">
              Tutorial ajudou? Ainda tem dúvida? Fale com o time técnico pelo WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function renderBody(body: string): ReactNode {
  const html = body
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-primary underline" target="_blank" rel="noreferrer">$1</a>'
    )
    .replace(/^- (.+)$/gm, "• $1");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
